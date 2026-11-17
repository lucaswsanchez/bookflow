import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './clients.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list(businessId: string, search?: string) {
    const q = search?.trim();
    const where: Prisma.ClientWhereInput = {
      businessId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    return this.prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { appointments: true } } },
    });
  }

  async get(businessId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, businessId },
      include: {
        appointments: {
          orderBy: { startsAt: 'desc' },
          take: 20,
          include: {
            service: { select: { name: true } },
            staff: { select: { name: true } },
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async create(businessId: string, dto: CreateClientDto) {
    await this.assertPhoneFree(businessId, dto.phone);
    return this.prisma.client.create({ data: { ...dto, businessId } });
  }

  async update(businessId: string, id: string, dto: UpdateClientDto) {
    await this.get(businessId, id);
    if (dto.phone) await this.assertPhoneFree(businessId, dto.phone, id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(businessId: string, id: string) {
    await this.get(businessId, id);
    const used = await this.prisma.appointment.count({ where: { clientId: id } });
    if (used > 0) {
      throw new ConflictException('Clients with appointments cannot be deleted');
    }
    await this.prisma.client.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertPhoneFree(businessId: string, phone: string, exceptId?: string) {
    const existing = await this.prisma.client.findUnique({
      where: { businessId_phone: { businessId, phone } },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('A client with this phone number already exists');
    }
  }
}
