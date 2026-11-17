import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, createTestApp, login, STAFF } from './utils';

interface Appointment {
  id: string;
  status: string;
  staff: { id: string; name: string };
}

const isoDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

describe('Appointments & dashboard (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let staffToken: string;
  const range = { from: isoDate(-7), to: isoDate(14) };

  beforeAll(async () => {
    app = await createTestApp();
    adminToken = (await login(app, ADMIN)).accessToken;
    staffToken = (await login(app, STAFF)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists appointments for all staff to an admin', async () => {
    const res = await request(app.getHttpServer())
      .get('/appointments')
      .query(range)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const staffNames = new Set(res.body.map((a: Appointment) => a.staff.name));
    expect(staffNames.size).toBe(3);
  });

  it('scopes STAFF users to their own agenda even if they ask for someone else', async () => {
    const all = await request(app.getHttpServer())
      .get('/appointments')
      .query(range)
      .set('Authorization', `Bearer ${adminToken}`);
    const other = all.body.find((a: Appointment) => a.staff.name !== 'Martín Acosta');

    const res = await request(app.getHttpServer())
      .get('/appointments')
      .query({ ...range, staffId: other.staff.id })
      .set('Authorization', `Bearer ${staffToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((a: Appointment) => a.staff.name === 'Martín Acosta')).toBe(true);

    await request(app.getHttpServer())
      .patch(`/appointments/${other.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'COMPLETED' })
      .expect(404);
  });

  it('lets staff change the status of their own appointments', async () => {
    const own = await request(app.getHttpServer())
      .get('/appointments')
      .query({ ...range, status: 'CONFIRMED' })
      .set('Authorization', `Bearer ${staffToken}`);
    const res = await request(app.getHttpServer())
      .patch(`/appointments/${own.body[0].id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'NO_SHOW' })
      .expect(200);
    expect(res.body.status).toBe('NO_SHOW');
  });

  it('rejects unknown statuses', async () => {
    const all = await request(app.getHttpServer())
      .get('/appointments')
      .query(range)
      .set('Authorization', `Bearer ${adminToken}`);
    await request(app.getHttpServer())
      .patch(`/appointments/${all.body[0].id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DONE' })
      .expect(400);
  });

  it('exports appointments as CSV', async () => {
    const res = await request(app.getHttpServer())
      .get('/appointments/export')
      .query(range)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('attachment');
    const lines = res.text.replace(String.fromCharCode(0xfeff), '').trim().split('\r\n');
    expect(lines[0]).toBe('Code,Date,Start,End,Status,Service,Staff,Client,Phone,Price (ARS)');
    expect(lines.length).toBeGreaterThan(10);
  });

  it('returns dashboard metrics for today and this week', async () => {
    const res = await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.week.appointments).toBeGreaterThanOrEqual(res.body.today.appointments);
    expect(res.body.week.estimatedRevenue).toEqual(expect.any(Number));
    expect(Array.isArray(res.body.upcoming)).toBe(true);
  });
});
