import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/auth.types';
import { CurrentUser, Roles } from '../common/decorators';
import { CreateStaffDto, SetWorkingHoursDto, UpdateStaffDto } from './staff.dto';
import { StaffService } from './staff.service';

@ApiTags('staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'List staff members with working hours and services' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  list(@CurrentUser() user: AuthUser, @Query('includeInactive') includeInactive?: string) {
    return this.staff.list(user.businessId, includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a staff member' })
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.staff.get(user.businessId, id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a staff member (admin)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStaffDto) {
    return this.staff.create(user.businessId, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a staff member (admin)' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(user.businessId, id, dto);
  }

  @Put(':id/working-hours')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Replace the weekly working hours of a staff member (admin)' })
  setWorkingHours(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SetWorkingHoursDto,
  ) {
    return this.staff.setWorkingHours(user.businessId, id, dto.workingHours);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete a staff member (admin). Deactivates if they have appointments.',
  })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.staff.remove(user.businessId, id);
  }
}
