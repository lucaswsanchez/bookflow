import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { AvailabilityService } from '../availability/availability.service';
import { generateBookingCode } from '../common/booking-code';
import { isOverlapError } from '../common/filters/all-exceptions.filter';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityQueryDto, CreateBookingDto } from './public.dto';

const SLOT_TAKEN = 'The selected time slot is no longer available';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
  ) {}

  async getBusiness(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        address: true,
        phone: true,
        timezone: true,
        currency: true,
      },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async listServices(slug: string) {
    const business = await this.getBusiness(slug);
    return this.prisma.service.findMany({
      where: { businessId: business.id, active: true, staff: { some: { active: true } } },
      select: { id: true, name: true, description: true, durationMinutes: true, price: true },
      orderBy: { price: 'asc' },
    });
  }

  async listStaff(slug: string, serviceId?: string) {
    const business = await this.getBusiness(slug);
    return this.prisma.staff.findMany({
      where: {
        businessId: business.id,
        active: true,
        ...(serviceId ? { services: { some: { id: serviceId } } } : {}),
      },
      select: { id: true, name: true, title: true, color: true },
      orderBy: { name: 'asc' },
    });
  }

  async getAvailability(slug: string, query: AvailabilityQueryDto) {
    const business = await this.getBusiness(slug);
    return this.availability.getSlots(business.id, query);
  }

  /**
   * Creates a booking. Inside a transaction we re-check availability (so the slot
   * must still be valid for the staff member's schedule) and insert the appointment.
   * The database exclusion constraint is the final guarantee against double booking
   * when two requests race for the same slot.
   */
  async createBooking(slug: string, dto: CreateBookingDto) {
    const business = await this.getBusiness(slug);
    const start = DateTime.fromISO(dto.startsAt, { zone: business.timezone });
    if (!start.isValid) throw new BadRequestException('startsAt must be a valid ISO date');
    const date = start.toISODate()!;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const { slots, service } = await this.availability.getSlots(
          business.id,
          { serviceId: dto.serviceId, staffId: dto.staffId, date },
          tx,
        );
        const slot = slots.find((s) => new Date(s.start).getTime() === start.toMillis());
        if (!slot) throw new ConflictException(SLOT_TAKEN);

        const fullService = await tx.service.findUniqueOrThrow({ where: { id: service.id } });
        const phone = dto.client.phone.trim();
        const client = await tx.client.upsert({
          where: { businessId_phone: { businessId: business.id, phone } },
          create: {
            businessId: business.id,
            name: dto.client.name.trim(),
            phone,
            email: dto.client.email,
          },
          update: {
            name: dto.client.name.trim(),
            ...(dto.client.email ? { email: dto.client.email } : {}),
          },
        });

        const appointment = await this.insertWithUniqueCode(tx, {
          businessId: business.id,
          staffId: dto.staffId,
          serviceId: service.id,
          clientId: client.id,
          startsAt: new Date(slot.start),
          endsAt: new Date(slot.end),
          price: fullService.price,
          notes: dto.notes,
        });
        return this.toBookingSummary(appointment.code, tx);
      });
    } catch (e) {
      if (isOverlapError(e)) throw new ConflictException(SLOT_TAKEN);
      throw e;
    }
  }

  async getBooking(code: string) {
    return this.toBookingSummary(code.toUpperCase(), this.prisma);
  }

  private async insertWithUniqueCode(
    tx: Prisma.TransactionClient,
    data: Omit<Prisma.AppointmentUncheckedCreateInput, 'code'>,
  ) {
    // 31^6 ≈ 887M combinations; a collision is extremely unlikely but checked anyway.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateBookingCode();
      const exists = await tx.appointment.findUnique({ where: { code }, select: { id: true } });
      if (!exists) return tx.appointment.create({ data: { ...data, code } });
    }
    throw new ConflictException('Could not generate a booking code, please retry');
  }

  private async toBookingSummary(code: string, db: PrismaService | Prisma.TransactionClient) {
    const a = await db.appointment.findUnique({
      where: { code },
      include: {
        service: { select: { name: true, durationMinutes: true } },
        staff: { select: { name: true } },
        client: { select: { name: true } },
        business: { select: { name: true, address: true, timezone: true } },
      },
    });
    if (!a) throw new NotFoundException('Booking not found');
    return {
      code: a.code,
      status: a.status,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt.toISOString(),
      price: a.price,
      service: a.service,
      staff: a.staff,
      clientName: a.client.name,
      business: a.business,
    };
  }
}
