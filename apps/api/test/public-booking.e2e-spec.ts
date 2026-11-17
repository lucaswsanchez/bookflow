import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, DEMO_SLUG } from './utils';

interface Slot {
  start: string;
  end: string;
  time: string;
}

describe('Public booking (e2e)', () => {
  let app: INestApplication;
  let serviceId: string;
  let staffId: string;

  const base = `/public/businesses/${DEMO_SLUG}`;

  /** Finds the first date (from tomorrow on) with at least `min` free slots. */
  async function findSlots(min = 2): Promise<{ date: string; slots: Slot[] }> {
    for (let i = 1; i <= 21; i++) {
      const date = new Date(Date.now() + i * 86_400_000).toISOString().slice(0, 10);
      const res = await request(app.getHttpServer())
        .get(`${base}/availability`)
        .query({ serviceId, staffId, date })
        .expect(200);
      if (res.body.slots.length >= min) return { date, slots: res.body.slots };
    }
    throw new Error('No availability found in the next 3 weeks');
  }

  beforeAll(async () => {
    app = await createTestApp();
    const services = await request(app.getHttpServer()).get(`${base}/services`).expect(200);
    serviceId = services.body.find((s: { name: string }) => s.name === 'Classic Haircut').id;
    const staff = await request(app.getHttpServer())
      .get(`${base}/staff`)
      .query({ serviceId })
      .expect(200);
    staffId = staff.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the public business profile', async () => {
    const res = await request(app.getHttpServer()).get(base).expect(200);
    expect(res.body).toMatchObject({
      slug: DEMO_SLUG,
      name: 'Barbería Costanera — Corrientes',
      timezone: 'America/Argentina/Buenos_Aires',
    });
  });

  it('returns 404 for an unknown business', async () => {
    await request(app.getHttpServer()).get('/public/businesses/does-not-exist').expect(404);
  });

  it('only lists staff who offer the selected service', async () => {
    const coloring = (await request(app.getHttpServer()).get(`${base}/services`)).body.find(
      (s: { name: string }) => s.name === 'Hair Coloring',
    );
    const res = await request(app.getHttpServer())
      .get(`${base}/staff`)
      .query({ serviceId: coloring.id })
      .expect(200);
    expect(res.body.map((s: { name: string }) => s.name)).toEqual(['Lucía Benítez']);
  });

  it('validates the availability query', async () => {
    await request(app.getHttpServer())
      .get(`${base}/availability`)
      .query({ serviceId, staffId, date: '01/12/2026' })
      .expect(400);
  });

  it('books a free slot, returns a confirmation code and removes the slot', async () => {
    const { date, slots } = await findSlots();
    const res = await request(app.getHttpServer())
      .post(`${base}/bookings`)
      .send({
        serviceId,
        staffId,
        startsAt: slots[0].start,
        client: { name: 'E2E Client', phone: '+54 379 4000001', email: 'e2e@example.com' },
      })
      .expect(201);
    expect(res.body.code).toMatch(/^BF-[A-Z2-9]{6}$/);
    expect(res.body).toMatchObject({ status: 'CONFIRMED', startsAt: slots[0].start });

    const after = await request(app.getHttpServer())
      .get(`${base}/availability`)
      .query({ serviceId, staffId, date })
      .expect(200);
    expect(after.body.slots.map((s: Slot) => s.start)).not.toContain(slots[0].start);

    const lookup = await request(app.getHttpServer())
      .get(`/public/bookings/${res.body.code}`)
      .expect(200);
    expect(lookup.body.clientName).toBe('E2E Client');
  });

  it('rejects booking a slot outside working hours', async () => {
    const { date } = await findSlots(1);
    await request(app.getHttpServer())
      .post(`${base}/bookings`)
      .send({
        serviceId,
        staffId,
        startsAt: `${date}T06:00:00.000Z`, // 03:00 local time
        client: { name: 'Night Owl', phone: '+54 379 4000002' },
      })
      .expect(409);
  });

  it('prevents double booking when two clients race for the same slot', async () => {
    const { slots } = await findSlots();
    const book = (phone: string) =>
      request(app.getHttpServer())
        .post(`${base}/bookings`)
        .send({ serviceId, staffId, startsAt: slots[0].start, client: { name: 'Racer', phone } });

    const results = await Promise.all([book('+54 379 4000003'), book('+54 379 4000004')]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);
  });

  it('validates the booking payload', async () => {
    const res = await request(app.getHttpServer())
      .post(`${base}/bookings`)
      .send({ serviceId, staffId, startsAt: 'tomorrow', client: { name: 'A', phone: 'abc' } })
      .expect(400);
    expect(res.body.message.length).toBeGreaterThanOrEqual(2);
  });
});
