import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiConflictResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { AvailabilityQueryDto, CreateBookingDto } from './public.dto';
import { PublicService } from './public.service';

@ApiTags('public booking')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('businesses/:slug')
  @ApiOperation({ summary: 'Public business profile' })
  getBusiness(@Param('slug') slug: string) {
    return this.publicService.getBusiness(slug);
  }

  @Get('businesses/:slug/services')
  @ApiOperation({ summary: 'Bookable services' })
  listServices(@Param('slug') slug: string) {
    return this.publicService.listServices(slug);
  }

  @Get('businesses/:slug/staff')
  @ApiOperation({ summary: 'Active staff, optionally only those offering a service' })
  @ApiQuery({ name: 'serviceId', required: false })
  listStaff(@Param('slug') slug: string, @Query('serviceId') serviceId?: string) {
    return this.publicService.listStaff(slug, serviceId);
  }

  @Get('businesses/:slug/availability')
  @ApiOperation({ summary: 'Available time slots for a service, staff member and date' })
  getAvailability(@Param('slug') slug: string, @Query() query: AvailabilityQueryDto) {
    return this.publicService.getAvailability(slug, query);
  }

  @Post('businesses/:slug/bookings')
  @ApiOperation({ summary: 'Book an appointment (no account needed)' })
  @ApiConflictResponse({ description: 'The slot is no longer available' })
  createBooking(@Param('slug') slug: string, @Body() dto: CreateBookingDto) {
    return this.publicService.createBooking(slug, dto);
  }

  @Get('bookings/:code')
  @ApiOperation({ summary: 'Look up a booking by its confirmation code' })
  getBooking(@Param('code') code: string) {
    return this.publicService.getBooking(code);
  }
}
