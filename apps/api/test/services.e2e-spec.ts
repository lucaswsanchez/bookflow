import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, createTestApp, login, STAFF } from './utils';

describe('Services (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    adminToken = (await login(app, ADMIN)).accessToken;
    staffToken = (await login(app, STAFF)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the 6 seeded services', async () => {
    const res = await request(app.getHttpServer())
      .get('/services')
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    expect(res.body[0]).toEqual(
      expect.objectContaining({ name: expect.any(String), durationMinutes: expect.any(Number) }),
    );
  });

  it('lets an admin create, update and delete a service', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Eyebrow Design', durationMinutes: 15, price: 4000 })
      .expect(201);

    const updated = await request(server)
      .patch(`/services/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 4500 })
      .expect(200);
    expect(updated.body.price).toBe(4500);

    const removed = await request(server)
      .delete(`/services/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(removed.body).toEqual({ deleted: true, deactivated: false });
  });

  it('rejects invalid service payloads', async () => {
    const res = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X', durationMinutes: 0, price: -5 })
      .expect(400);
    expect(res.body.message.length).toBeGreaterThanOrEqual(3);
  });

  it('forbids STAFF users from creating services', async () => {
    await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Not allowed', durationMinutes: 30, price: 1000 })
      .expect(403);
  });
});
