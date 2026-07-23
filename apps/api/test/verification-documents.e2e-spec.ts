import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VerificationDocumentUploadResponse } from '@pickle/types';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import {
  mintIdToken,
  teardownTestFirebaseApp,
} from './helpers/firebase-emulator';

describe('VerificationDocuments (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await teardownTestFirebaseApp();
  });

  it('rejects a request with no token', async () => {
    await request(app.getHttpServer())
      .post('/verification-documents')
      .send({ docType: 'ID', contentType: 'image/jpeg' })
      .expect(401);
  });

  it('rejects an invalid request body', async () => {
    const token = await mintIdToken(`doc-invalid-${Date.now()}@example.test`);

    const res = await request(app.getHttpServer())
      .post('/verification-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'ID', contentType: 'application/x-not-allowed' })
      .expect(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('creates a document owned by the caller and returns a signed upload URL', async () => {
    const token = await mintIdToken(`doc-owner-${Date.now()}@example.test`);

    const res = await request(app.getHttpServer())
      .post('/verification-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'ID', contentType: 'image/jpeg' })
      .expect(201);

    expect(res.body).toMatchObject({
      document: { docType: 'ID', status: 'PENDING' },
      uploadUrl: expect.stringContaining('http') as string,
    });

    const me = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body).toMatchObject({ needsOnboarding: false });
  });

  it('lets the owner read their own document', async () => {
    const token = await mintIdToken(`doc-read-own-${Date.now()}@example.test`);

    const created = await request(app.getHttpServer())
      .post('/verification-documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ docType: 'ID', contentType: 'image/jpeg' })
      .expect(201);
    const { document } = created.body as VerificationDocumentUploadResponse;

    const res = await request(app.getHttpServer())
      .get(`/verification-documents/${document.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toMatchObject({ id: document.id });
  });

  it("blocks a different user from reading someone else's document (IDOR)", async () => {
    const ownerToken = await mintIdToken(
      `doc-victim-${Date.now()}@example.test`,
    );
    const attackerToken = await mintIdToken(
      `doc-attacker-${Date.now()}@example.test`,
    );

    const created = await request(app.getHttpServer())
      .post('/verification-documents')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ docType: 'ID', contentType: 'image/jpeg' })
      .expect(201);
    const { document } = created.body as VerificationDocumentUploadResponse;

    const res = await request(app.getHttpServer())
      .get(`/verification-documents/${document.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(403);
    expect(res.body).toMatchObject({ code: 'DOCUMENT_FORBIDDEN' });
  });

  it('404s for a document that does not exist', async () => {
    const token = await mintIdToken(`doc-missing-${Date.now()}@example.test`);

    const res = await request(app.getHttpServer())
      .get('/verification-documents/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(res.body).toMatchObject({ code: 'DOCUMENT_NOT_FOUND' });
  });
});
