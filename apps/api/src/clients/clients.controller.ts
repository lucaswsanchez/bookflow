import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser, Roles } from '../common/decorators';
import { CreateClientDto, UpdateClientDto } from './clients.dto';
import { ClientsService } from './clients.service';

@ApiTags('clients')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients, optionally filtered by name, phone or email (admin)' })
  @ApiQuery({ name: 'search', required: false })
  list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.clients.list(user.businessId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client with their latest appointments (admin)' })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.clients.get(user.businessId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a client (admin)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateClientDto) {
    return this.clients.create(user.businessId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client (admin)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(user.businessId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client without appointments (admin)' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.clients.remove(user.businessId, id);
  }
}
