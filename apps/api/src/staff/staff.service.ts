import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto, UpdateStaffDto, WorkingHoursDto } from './staff.dto';

const include = {
  workingHours: { orderBy: [{ weekday: 'asc' as const }, { startMinute: 'asc' as const }] },
  services: { select: { id: true, name: true } },
  user: { select: { id: true, email: true } },
};

/** Ensures every range is valid and ranges on the same weekday don't overlap. */
export function validateWorkingHours(ranges: WorkingHoursDto[]) {
  const sorted = [...ranges].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.endMinute <= r.startMinute) {
      throw new BadRequestException('Each working range must end after it starts');
    }
    const prev = sorted[i - 1];
    if (prev && prev.weekday === r.weekday && r.startMinute < prev.endMinute) {
      throw new BadRequestException('Working ranges on the same day must not overlap');
    }
  }
}

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  list(businessId: string, includeInactive = false) {
    return this.prisma.staff.findMany({
      where: { businessId, ...(includeInactive ? {} : { active: true }) },
      include,
      orderBy: { name: 'asc' },
    });
  }

  async get(businessId: string, id: string) {
    const staff = await this.prisma.staff.findFirst({ where: { id, businessId }, include });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(businessId: string, dto: CreateStaffDto) {
    const { serviceIds = [], workingHours = [], ...data } = dto;
    validateWorkingHours(workingHours);
    await this.assertServices(businessId, serviceIds);
    return this.prisma.staff.create({
      data: {
        ...data,
        businessId,
        services: { connect: serviceIds.map((id) => ({ id })) },
        workingHours: { create: workingHours },
      },
      include,
    });
  }

  async update(businessId: string, id: string, dto: UpdateStaffDto) {
    await this.get(businessId, id);
    const { serviceIds, ...data } = dto;
    if (serviceIds) await this.assertServices(businessId, serviceIds);
    return this.prisma.staff.update({
      where: { id },
      data: {
        ...data,
        ...(serviceIds ? { services: { set: serviceIds.map((sid) => ({ id: sid })) } } : {}),
      },
      include,
    });
  }

  async setWorkingHours(businessId: string, id: string, ranges: WorkingHoursDto[]) {
    await this.get(businessId, id);
    validateWorkingHours(ranges);
    await this.prisma.$transaction([
      this.prisma.workingHours.deleteMany({ where: { staffId: id } }),
      this.prisma.workingHours.createMany({ data: ranges.map((r) => ({ ...r, staffId: id })) }),
    ]);
    return this.get(businessId, id);
  }

  async remove(businessId: string, id: string) {
    await this.get(businessId, id);
    const used = await this.prisma.appointment.count({ where: { staffId: id } });
    if (used > 0) {
      await this.prisma.staff.update({ where: { id }, data: { active: false } });
      return { deleted: false, deactivated: true };
    }
    await this.prisma.staff.delete({ where: { id } });
    return { deleted: true, deactivated: false };
  }

  private async assertServices(businessId: string, ids: string[]) {
    if (ids.length === 0) return;
    const count = await this.prisma.service.count({ where: { businessId, id: { in: ids } } });
    if (count !== new Set(ids).size) throw new BadRequestException('Unknown service id');
  }
}
