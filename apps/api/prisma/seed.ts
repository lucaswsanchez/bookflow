/**
 * Deterministic demo seed for "Barbería Costanera — Corrientes".
 *
 * - Wipes and recreates all demo data (safe to run on every deploy).
 * - Uses a seeded PRNG so the same day always produces the same agenda.
 * - Appointments are generated relative to "today" in the business time zone:
 *   the past 7 days (completed / no-show history) and the next 14 days.
 */
import { AppointmentStatus, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DateTime } from 'luxon';
import { generateBookingCode } from '../src/common/booking-code';

const TZ = 'America/Argentina/Buenos_Aires';

export const DEMO_SLUG = 'barberia-costanera';
export const DEMO_USERS = {
  admin: { email: 'admin@demo.com', password: 'Admin123!' },
  staff: { email: 'staff@demo.com', password: 'Staff123!' },
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

const SERVICES = [
  {
    key: 'cut',
    name: 'Classic Haircut',
    description: 'Scissor or clipper cut, wash and style.',
    durationMinutes: 30,
    price: 9000,
  },
  {
    key: 'beard',
    name: 'Beard Trim',
    description: 'Shape-up and trim with a hot towel finish.',
    durationMinutes: 20,
    price: 6000,
  },
  {
    key: 'combo',
    name: 'Haircut + Beard',
    description: 'Our most popular combo.',
    durationMinutes: 50,
    price: 13500,
  },
  {
    key: 'kids',
    name: 'Kids Haircut',
    description: 'For children under 12.',
    durationMinutes: 30,
    price: 7000,
  },
  {
    key: 'shave',
    name: 'Hot Towel Shave',
    description: 'Traditional straight-razor shave.',
    durationMinutes: 40,
    price: 10000,
  },
  {
    key: 'color',
    name: 'Hair Coloring',
    description: 'Full color or grey blending.',
    durationMinutes: 90,
    price: 25000,
  },
] as const;

type ServiceKey = (typeof SERVICES)[number]['key'];

interface StaffSeed {
  name: string;
  title: string;
  color: string;
  services: ServiceKey[];
  /** weekday (0 = Sunday) -> list of [startMinute, endMinute] */
  hours: Record<number, [number, number][]>;
}

const weekdays = (days: number[], ranges: [number, number][]) =>
  Object.fromEntries(days.map((d) => [d, ranges]));

const STAFF: StaffSeed[] = [
  {
    name: 'Martín Acosta',
    title: 'Senior Barber',
    color: '#4f46e5',
    services: ['cut', 'beard', 'combo', 'kids', 'shave'],
    hours: {
      ...weekdays(
        [1, 2, 3, 4, 5],
        [
          [h(9), h(13)],
          [h(16), h(20)],
        ],
      ),
      6: [[h(9), h(13)]],
    },
  },
  {
    name: 'Lucía Benítez',
    title: 'Stylist & Colorist',
    color: '#db2777',
    services: ['cut', 'kids', 'color'],
    hours: weekdays([2, 3, 4, 5, 6], [[h(10), h(18)]]),
  },
  {
    name: 'Diego Ramírez',
    title: 'Barber',
    color: '#0d9488',
    services: ['cut', 'beard', 'combo', 'shave'],
    hours: { ...weekdays([1, 2, 3, 4, 5], [[h(15), h(21)]]), 6: [[h(9), h(14)]] },
  },
];

const CLIENTS: [string, string, string | null][] = [
  ['Juan Pérez', '+54 379 4501234', 'juan.perez@example.com'],
  ['María González', '+54 379 4502345', 'maria.gonzalez@example.com'],
  ['Carlos Fernández', '+54 379 4503456', null],
  ['Ana López', '+54 379 4504567', 'ana.lopez@example.com'],
  ['Pablo Romero', '+54 379 4505678', null],
  ['Sofía Martínez', '+54 379 4506789', 'sofia.martinez@example.com'],
  ['Federico Gómez', '+54 379 4507890', null],
  ['Valentina Díaz', '+54 379 4508901', 'valen.diaz@example.com'],
  ['Matías Sosa', '+54 379 4509012', null],
  ['Camila Torres', '+54 379 4510123', 'camila.torres@example.com'],
  ['Nicolás Ruiz', '+54 379 4511234', null],
  ['Lucas Morales', '+54 379 4512345', 'lucas.morales@example.com'],
  ['Florencia Castro', '+54 379 4513456', null],
  ['Agustín Ortiz', '+54 379 4514567', 'agustin.ortiz@example.com'],
  ['Julieta Silva', '+54 379 4515678', null],
  ['Tomás Medina', '+54 379 4516789', 'tomas.medina@example.com'],
  ['Martina Herrera', '+54 379 4517890', null],
  ['Santiago Aguirre', '+54 379 4518901', 'santi.aguirre@example.com'],
  ['Rocío Giménez', '+54 379 4519012', null],
  ['Gonzalo Vera', '+54 379 4520123', 'gonzalo.vera@example.com'],
];

export async function seed(prisma: PrismaClient) {
  const random = mulberry32(20261117);

  // Wipe in dependency order
  await prisma.appointment.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workingHours.deleteMany();
  await prisma.client.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: {
      slug: DEMO_SLUG,
      name: 'Barbería Costanera — Corrientes',
      description: 'Classic cuts and modern styles a few blocks from the Costanera.',
      address: 'Av. Costanera Gral. San Martín 1200, Corrientes, Argentina',
      phone: '+54 379 4400000',
      timezone: TZ,
    },
  });

  const services = new Map<ServiceKey, { id: string; durationMinutes: number; price: number }>();
  for (const s of SERVICES) {
    const created = await prisma.service.create({
      data: {
        businessId: business.id,
        name: s.name,
        description: s.description,
        durationMinutes: s.durationMinutes,
        price: s.price,
      },
    });
    services.set(s.key, created);
  }

  const staffRecords: { id: string; def: StaffSeed }[] = [];
  for (const def of STAFF) {
    const staff = await prisma.staff.create({
      data: {
        businessId: business.id,
        name: def.name,
        title: def.title,
        color: def.color,
        services: { connect: def.services.map((k) => ({ id: services.get(k)!.id })) },
        workingHours: {
          create: Object.entries(def.hours).flatMap(([weekday, ranges]) =>
            ranges.map(([startMinute, endMinute]) => ({
              weekday: Number(weekday),
              startMinute,
              endMinute,
            })),
          ),
        },
      },
    });
    staffRecords.push({ id: staff.id, def });
  }

  const [adminHash, staffHash] = await Promise.all([
    bcrypt.hash(DEMO_USERS.admin.password, 10),
    bcrypt.hash(DEMO_USERS.staff.password, 10),
  ]);
  await prisma.user.create({
    data: {
      email: DEMO_USERS.admin.email,
      passwordHash: adminHash,
      name: 'Admin Demo',
      role: Role.ADMIN,
      businessId: business.id,
    },
  });
  await prisma.user.create({
    data: {
      email: DEMO_USERS.staff.email,
      passwordHash: staffHash,
      name: staffRecords[0].def.name,
      role: Role.STAFF,
      businessId: business.id,
      staffId: staffRecords[0].id,
    },
  });

  const clientIds: string[] = [];
  for (const [name, phone, email] of CLIENTS) {
    const c = await prisma.client.create({
      data: { businessId: business.id, name, phone, email },
    });
    clientIds.push(c.id);
  }

  const now = DateTime.now().setZone(TZ);
  const today = now.startOf('day');
  const appointments: {
    code: string;
    businessId: string;
    staffId: string;
    serviceId: string;
    clientId: string;
    startsAt: Date;
    endsAt: Date;
    status: AppointmentStatus;
    price: number;
  }[] = [];
  const usedCodes = new Set<string>();

  for (let offset = -7; offset < 14; offset++) {
    const day = today.plus({ days: offset });
    const weekday = day.weekday % 7; // luxon: 1 = Mon ... 7 = Sun  ->  0 = Sun ... 6 = Sat
    for (const { id: staffId, def } of staffRecords) {
      for (const [start, end] of def.hours[weekday] ?? []) {
        let cursor = start;
        while (cursor < end) {
          // ~50% occupancy keeps plenty of free slots for the public booking demo
          if (random() < 0.5) {
            cursor += 30;
            continue;
          }
          const key = def.services[Math.floor(random() * def.services.length)];
          const service = services.get(key)!;
          if (cursor + service.durationMinutes > end) {
            cursor += 30;
            continue;
          }
          const startsAt = day.plus({ minutes: cursor });
          const endsAt = startsAt.plus({ minutes: service.durationMinutes });
          let status: AppointmentStatus = AppointmentStatus.CONFIRMED;
          if (endsAt < now) {
            const r = random();
            status =
              r < 0.85
                ? AppointmentStatus.COMPLETED
                : r < 0.93
                  ? AppointmentStatus.NO_SHOW
                  : AppointmentStatus.CANCELLED;
          } else if (random() < 0.05) {
            status = AppointmentStatus.CANCELLED;
          }
          let code = generateBookingCode(random);
          while (usedCodes.has(code)) code = generateBookingCode(random);
          usedCodes.add(code);
          appointments.push({
            code,
            businessId: business.id,
            staffId,
            serviceId: service.id,
            clientId: clientIds[Math.floor(random() * clientIds.length)],
            startsAt: startsAt.toJSDate(),
            endsAt: endsAt.toJSDate(),
            status,
            price: service.price,
          });
          // Next appointment starts on the next 10-minute boundary
          cursor += Math.ceil(service.durationMinutes / 10) * 10;
        }
      }
    }
  }
  await prisma.appointment.createMany({ data: appointments });

  return { businessId: business.id, appointments: appointments.length };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seed(prisma)
    .then((r) => console.log(`Seed complete: ${r.appointments} appointments created.`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
