import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { computeAvailableSlots, InvalidAvailabilityInputError, Slot } from './availability.engine';

/** How far ahead clients can book. */
export const BOOKING_HORIZON_DAYS = 60;

export interface SlotQuery {
  serviceId: string;
  staffId: string;
  date: string;
}

type Db = PrismaService | Prisma.TransactionClient;

/**
 * Loads working hours and existing appointments from the database and delegates
 * the actual calculation to the pure availability engine.
 */
@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlots(businessId: string, query: SlotQuery, db: Db = this.prisma) {
    const business = await db.business.findUniqueOrThrow({ where: { id: businessId } });
    const service = await db.service.findFirst({
      where: { id: query.serviceId, businessId, active: true },
    });
    if (!service) throw new NotFoundException('Service not found');

    const staff = await db.staff.findFirst({
      where: {
        id: query.staffId,
        businessId,
        active: true,
        services: { some: { id: service.id } },
      },
      include: { workingHours: true },
    });
    if (!staff)
      throw new NotFoundException('Staff member not found or does not offer this service');

    const day = DateTime.fromISO(query.date, { zone: business.timezone });
    if (!day.isValid) throw new BadRequestException('date must be a valid YYYY-MM-DD date');
    const today = DateTime.now().setZone(business.timezone).startOf('day');
    if (day.startOf('day') > today.plus({ days: BOOKING_HORIZON_DAYS })) {
      throw new BadRequestException(
        `Bookings can be made up to ${BOOKING_HORIZON_DAYS} days in advance`,
      );
    }

    const dayStart = day.startOf('day').toJSDate();
    const dayEnd = day.endOf('day').toJSDate();
    const busy = await db.appointment.findMany({
      where: {
        staffId: staff.id,
        status: { not: AppointmentStatus.CANCELLED },
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    });

    let slots: Slot[];
    try {
      slots = computeAvailableSlots({
        date: query.date,
        timezone: business.timezone,
        workingHours: staff.workingHours,
        durationMinutes: service.durationMinutes,
        busy: busy.map((b) => ({ start: b.startsAt, end: b.endsAt })),
        now: new Date(),
      });
    } catch (e) {
      if (e instanceof InvalidAvailabilityInputError) throw new BadRequestException(e.message);
      throw e;
    }

    return {
      date: query.date,
      timezone: business.timezone,
      service: { id: service.id, name: service.name, durationMinutes: service.durationMinutes },
      staff: { id: staff.id, name: staff.name },
      slots,
    };
  }
}
