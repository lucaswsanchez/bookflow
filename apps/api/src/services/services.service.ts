import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list(businessId: string, includeInactive = false) {
    return this.prisma.service.findMany({
      where: { businessId, ...(includeInactive ? {} : { active: true }) },
      orderBy: { name: 'asc' },
    });
  }

  async get(businessId: string, id: string) {
    const service = await this.prisma.service.findFirst({ where: { id, businessId } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  create(businessId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({ data: { ...dto, businessId } });
  }

  async update(businessId: string, id: string, dto: UpdateServiceDto) {
    await this.get(businessId, id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  /**
   * Services referenced by appointments are deactivated instead of deleted,
   * so historical appointments and revenue stay intact.
   */
  async remove(businessId: string, id: string) {
    await this.get(businessId, id);
    const used = await this.prisma.appointment.count({ where: { serviceId: id } });
    if (used > 0) {
      await this.prisma.service.update({ where: { id }, data: { active: false } });
      return { deleted: false, deactivated: true };
    }
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true, deactivated: false };
  }
}
