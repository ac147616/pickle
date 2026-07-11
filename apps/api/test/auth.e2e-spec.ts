import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { UserRole } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  mintIdToken,
  teardownTestFirebaseApp,
} from './helpers/firebase-emulator';

describe('Auth (e2e)', () => {
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
    const res = await request(app.getHttpServer()).get('/me').expect(401);
    expect(res.body).toEqual({
      code: 'AUTH_MISSING_TOKEN',
      message: 'Missing bearer token',
    });
  });

  it('rejects a request with an invalid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
    expect(res.body).toEqual({
      code: 'AUTH_INVALID_TOKEN',
      message: 'Invalid or expired token',
    });
  });

  it('accepts a valid token and auto-provisions a SHIPPER user', async () => {
    const email = `shipper-${Date.now()}@example.test`;
    const token = await mintIdToken(email);

    const res = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      email,
      role: 'SHIPPER',
      status: 'ACTIVE',
    });
  });

  it('blocks a non-admin from an admin-only route', async () => {
    const email = `shipper-noadmin-${Date.now()}@example.test`;
    const token = await mintIdToken(email);

    const res = await request(app.getHttpServer())
      .get('/admin/ping')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(res.body).toEqual({
      code: 'AUTH_ROLE_FORBIDDEN',
      message: 'Insufficient role',
    });
  });

  it('allows an admin user through the role guard', async () => {
    const email = `admin-${Date.now()}@example.test`;
    const token = await mintIdToken(email);

    // Provisions the user first, then promotes directly in Postgres - there's
    // no admin-promotion endpoint yet, that's an operational/1.2 concern.
    await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await prisma.user.update({
      where: { email },
      data: { role: UserRole.ADMIN },
    });

    const res = await request(app.getHttpServer())
      .get('/admin/ping')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({ ok: true });
  });
});
