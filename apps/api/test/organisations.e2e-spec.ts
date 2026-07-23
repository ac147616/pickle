import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Organisation } from '@pickle/types';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  mintIdToken,
  teardownTestFirebaseApp,
} from './helpers/firebase-emulator';

describe('Organisations (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
    await teardownTestFirebaseApp();
  });

  it('rejects a request with no token', async () => {
    await request(app.getHttpServer())
      .post('/organisations')
      .send({ name: 'Acme', type: 'CARRIER' })
      .expect(401);
  });

  it('rejects an invalid request body', async () => {
    const token = await mintIdToken(`org-invalid-${Date.now()}@example.test`);

    const res = await request(app.getHttpServer())
      .post('/organisations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', type: 'NOT_A_REAL_TYPE' })
      .expect(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('creates an organisation and makes the caller its OWNER', async () => {
    const email = `org-owner-${Date.now()}@example.test`;
    const token = await mintIdToken(email);
    // nzbn is @unique - a fixed value would collide with 0.2's seed data or
    // a prior test run against this persistent local Postgres.
    const nzbn = String(Date.now()).padStart(13, '9');

    const res = await request(app.getHttpServer())
      .post('/organisations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Freight Ltd', nzbn, type: 'CARRIER' })
      .expect(201);

    expect(res.body).toMatchObject({
      name: 'Acme Freight Ltd',
      nzbn,
      type: 'CARRIER',
    });
    const createdOrg = res.body as Organisation;

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const membership = await prisma.organisationMember.findUniqueOrThrow({
      where: {
        organisationId_userId: {
          organisationId: createdOrg.id,
          userId: user.id,
        },
      },
    });
    expect(membership.memberRole).toBe('OWNER');

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body).toMatchObject({ needsOnboarding: false });
  });

  it('returns a stub company for a well-formed NZBN', async () => {
    const token = await mintIdToken(`org-nzbn-ok-${Date.now()}@example.test`);

    const res = await request(app.getHttpServer())
      .get('/organisations/nzbn/9429041234567')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toMatchObject({ nzbn: '9429041234567' });
  });

  it('404s for a malformed NZBN', async () => {
    const token = await mintIdToken(`org-nzbn-bad-${Date.now()}@example.test`);

    const res = await request(app.getHttpServer())
      .get('/organisations/nzbn/not-a-number')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(res.body).toMatchObject({ code: 'NZBN_NOT_FOUND' });
  });
});
