import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, createTestApp, login, STAFF } from './utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in the demo admin and returns a token pair', async () => {
    const res = await request(app.getHttpServer()).post('/auth/login').send(ADMIN).expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toContain('.');
    expect(res.body.user).toMatchObject({ email: ADMIN.email, role: 'ADMIN' });
  });

  it('rejects wrong credentials with a consistent error body', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN.email, password: 'wrong-password' })
      .expect(401);
    expect(res.body).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
      path: '/auth/login',
    });
  });

  it('validates the login payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('returns the current user from /auth/me', async () => {
    const { accessToken } = await login(app, STAFF);
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ email: STAFF.email, role: 'STAFF' });
    expect(res.body.staffId).toEqual(expect.any(String));
    expect(res.body.business.slug).toBe('barberia-costanera');
  });

  it('rejects protected routes without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('rotates refresh tokens and rejects reuse of the old one', async () => {
    const { refreshToken } = await login(app, ADMIN);
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);
    expect(res.body.refreshToken).not.toBe(refreshToken);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('revokes the refresh token on logout', async () => {
    const { refreshToken } = await login(app, ADMIN);
    await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken }).expect(204);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('rate limits repeated login attempts from the same IP', async () => {
    const limit = Number(process.env.LOGIN_RATE_LIMIT ?? 10);
    const attempt = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Forwarded-For', '203.0.113.50')
        .send({ email: ADMIN.email, password: 'wrong-password' });
    for (let i = 0; i < limit; i++) {
      await attempt().expect(401);
    }
    const res = await attempt().expect(429);
    expect(res.body.statusCode).toBe(429);
  });
});
