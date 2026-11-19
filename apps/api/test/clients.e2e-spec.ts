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

  it.each([
    ['a phone without digits', { name: 'No Digits', phone: '------' }, 'phone'],
    ['a phone with fewer than 6 digits', { name: 'Few Digits', phone: '(12) 34-5' }, 'phone'],
    ['a whitespace-only name', { name: '   ', phone: '+54 379 4999998' }, 'name'],
  ])('rejects %s', async (_case, payload, field) => {
    const res = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);
    expect(JSON.stringify(res.body.message)).toContain(field);
  });

  it('stores trimmed names and phones', async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Trimmed Client  ', phone: ' +54 379 4999997 ' })
      .expect(201);
    expect(created.body).toMatchObject({ name: 'Trimmed Client', phone: '+54 379 4999997' });
    await request(server)
      .delete(`/clients/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
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
