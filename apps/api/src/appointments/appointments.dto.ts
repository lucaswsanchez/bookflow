import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class AppointmentsQueryDto {
  @ApiPropertyOptional({ example: '2026-12-01', description: 'First local date (inclusive)' })
  @IsOptional()
  @Matches(DATE, { message: 'from must be formatted YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-07', description: 'Last local date (inclusive)' })
  @IsOptional()
  @Matches(DATE, { message: 'to must be formatted YYYY-MM-DD' })
  to?: string;

  @ApiPropertyOptional({ description: 'Ignored for STAFF users (always their own agenda)' })
  @IsOptional()
  @IsString()
  staffId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.COMPLETED })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
