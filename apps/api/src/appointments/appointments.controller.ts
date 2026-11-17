import { Body, Controller, Get, Header, Param, Patch, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser } from '../common/decorators';
import { AppointmentsQueryDto, UpdateStatusDto } from './appointments.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller()
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get('appointments')
  @ApiOperation({ summary: 'List appointments in a date range (STAFF: own agenda only)' })
  list(@CurrentUser() user: AuthUser, @Query() query: AppointmentsQueryDto) {
    return this.appointments.list(user, query);
  }

  @Get('appointments/export')
  @ApiOperation({ summary: 'Export appointments in a date range as CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(
    @CurrentUser() user: AuthUser,
    @Query() query: AppointmentsQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.appointments.exportCsv(user, query);
    const name = `bookflow-appointments-${query.from ?? 'today'}${query.to ? `-to-${query.to}` : ''}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    // BOM so Excel opens accented names (e.g. "Martín") correctly
    res.send(String.fromCharCode(0xfeff) + csv);
  }

  @Get('appointments/:id')
  @ApiOperation({ summary: 'Get an appointment' })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.appointments.get(user, id);
  }

  @Patch('appointments/:id/status')
  @ApiOperation({ summary: 'Change status: CONFIRMED, COMPLETED, CANCELLED or NO_SHOW' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointments.updateStatus(user, id, dto.status);
  }

  @Get('dashboard/summary')
  @ApiTags('dashboard')
  @ApiOperation({ summary: "Today's and this week's appointments and estimated revenue" })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.appointments.dashboard(user);
  }
}
