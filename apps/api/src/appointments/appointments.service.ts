import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Prisma, Role } from '@prisma/client';
import { DateTime } from 'luxon';
import { AuthUser } from '../auth/auth.types';
import { isOverlapError } from '../common/filters/all-exceptions.filter';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentsQueryDto } from './appointments.dto';
import { toCsv } from './csv';

const include = {
  service: { select: { id: true, name: true, durationMinutes: true } },
  staff: { select: { id: true, name: true, color: true } },
  client: { select: { id: true, name: true, phone: true, email: true } },
} satisfies Prisma.AppointmentInclude;

/** Statuses that count towards estimated revenue. */
const BILLABLE: AppointmentStatus[] = [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED];

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** STAFF users are always scoped to their own agenda, whatever they ask for. */
  private scope(user: AuthUser, staffId?: string): Prisma.AppointmentWhereInput {
    if (user.role === Role.STAFF)
      return { businessId: user.businessId, staffId: user.staffId ?? '-' };
    return { businessId: user.businessId, ...(staffId ? { staffId } : {}) };
  }

  private async timezone(businessId: string) {
    const b = await this.prisma.business.findUniqueOrThrow({ where: { id: businessId } });
    return b.timezone;
  }

  async list(user: AuthUser, query: AppointmentsQueryDto) {
    const tz = await this.timezone(user.businessId);
    const today = DateTime.now().setZone(tz).toISODate()!;
    const from = DateTime.fromISO(query.from ?? today, { zone: tz }).startOf('day');
    const to = DateTime.fromISO(query.to ?? query.from ?? today, { zone: tz }).endOf('day');
    return this.prisma.appointment.findMany({
      where: {
        ...this.scope(user, query.staffId),
        ...(query.status ? { status: query.status } : {}),
        startsAt: { gte: from.toJSDate(), lte: to.toJSDate() },
      },
      include,
      orderBy: { startsAt: 'asc' },
    });
  }

  async get(user: AuthUser, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, ...this.scope(user) },
      include,
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async updateStatus(user: AuthUser, id: string, status: AppointmentStatus) {
    await this.get(user, id);
    try {
      return await this.prisma.appointment.update({ where: { id }, data: { status }, include });
    } catch (e) {
      // Re-activating a cancelled appointment whose slot was taken meanwhile
      if (isOverlapError(e)) {
        throw new ConflictException('This time slot has been booked by someone else');
      }
      throw e;
    }
  }

  async exportCsv(user: AuthUser, query: AppointmentsQueryDto) {
    const tz = await this.timezone(user.businessId);
    const rows = await this.list(user, query);
    return toCsv(
      [
        'Code',
        'Date',
        'Start',
        'End',
        'Status',
        'Service',
        'Staff',
        'Client',
        'Phone',
        'Price (ARS)',
      ],
      rows.map((a) => {
        const start = DateTime.fromJSDate(a.startsAt, { zone: tz });
        return [
          a.code,
          start.toISODate(),
          start.toFormat('HH:mm'),
          DateTime.fromJSDate(a.endsAt, { zone: tz }).toFormat('HH:mm'),
          a.status,
          a.service.name,
          a.staff.name,
          a.client.name,
          a.client.phone,
          a.price,
        ];
      }),
    );
  }

  async dashboard(user: AuthUser) {
    const tz = await this.timezone(user.businessId);
    const now = DateTime.now().setZone(tz);
    const scope = this.scope(user);

    const summarize = async (from: DateTime, to: DateTime) => {
      const where = { ...scope, startsAt: { gte: from.toJSDate(), lte: to.toJSDate() } };
      const [total, billable, byStatus] = await Promise.all([
        this.prisma.appointment.count({
          where: { ...where, status: { not: AppointmentStatus.CANCELLED } },
        }),
        this.prisma.appointment.aggregate({
          where: { ...where, status: { in: BILLABLE } },
          _sum: { price: true },
        }),
        this.prisma.appointment.groupBy({ by: ['status'], where, _count: true }),
      ]);
      return {
        from: from.toISODate(),
        to: to.toISODate(),
        appointments: total,
        estimatedRevenue: billable._sum.price ?? 0,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      };
    };

    const [today, week, upcoming] = await Promise.all([
      summarize(now.startOf('day'), now.endOf('day')),
      summarize(now.startOf('week'), now.endOf('week')), // ISO week: Monday → Sunday
      this.prisma.appointment.findMany({
        where: { ...scope, status: AppointmentStatus.CONFIRMED, startsAt: { gte: now.toJSDate() } },
        include,
        orderBy: { startsAt: 'asc' },
        take: 6,
      }),
    ]);

    return { timezone: tz, currency: 'ARS', today, week, upcoming };
  }
}
