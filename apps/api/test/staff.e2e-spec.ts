import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ADMIN, createTestApp, login } from './utils';

describe('Staff (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = (await login(app, ADMIN)).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the 3 seeded staff members with their weekly hours', async () => {
    const res = await request(app.getHttpServer())
      .get('/staff')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].workingHours.length).toBeGreaterThan(0);
    expect(res.body[0].services.length).toBeGreaterThan(0);
  });

  it('creates a staff member and replaces their working hours', async () => {
    const server = app.getHttpServer();
    const services = await request(server).get('/services').set('Authorization', `Bearer ${token}`);
    const created = await request(server)
      .post('/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Barber',
        serviceIds: [services.body[0].id],
        workingHours: [{ weekday: 1, startMinute: 540, endMinute: 720 }],
      })
      .expect(201);
    expect(created.body.workingHours).toHaveLength(1);

    const updated = await request(server)
      .put(`/staff/${created.body.id}/working-hours`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        workingHours: [
          { weekday: 2, startMinute: 540, endMinute: 720 },
          { weekday: 2, startMinute: 840, endMinute: 1080 },
        ],
      })
      .expect(200);
    expect(updated.body.workingHours).toHaveLength(2);

    await request(server)
      .delete(`/staff/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('rejects overlapping working hours', async () => {
    const list = await request(app.getHttpServer())
      .get('/staff')
      .set('Authorization', `Bearer ${token}`);
    await request(app.getHttpServer())
      .put(`/staff/${list.body[0].id}/working-hours`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        workingHours: [
          { weekday: 1, startMinute: 540, endMinute: 780 },
          { weekday: 1, startMinute: 700, endMinute: 900 },
        ],
      })
      .expect(400);
  });
});
