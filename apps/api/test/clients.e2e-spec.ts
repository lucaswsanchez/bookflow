import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, createTestApp, login, STAFF } from './utils';

describe('Clients (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = (await login(app, ADMIN)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the 20 seeded clients', async () => {
    const res = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(20);
  });

  it('searches clients by name (case-insensitive)', async () => {
    const res = await request(app.getHttpServer())
      .get('/clients?search=juan')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.map((c: { name: string }) => c.name)).toContain('Juan Pérez');
  });

  it('creates a client and rejects a duplicate phone number', async () => {
    const server = app.getHttpServer();
    const payload = { name: 'New Client', phone: '+54 379 4999999' };
    const created = await request(server)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    await request(server)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(409);
    await request(server)
      .delete(`/clients/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('is not available to STAFF users', async () => {
    const staffToken = (await login(app, STAFF)).accessToken;
    await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(403);
  });
});
