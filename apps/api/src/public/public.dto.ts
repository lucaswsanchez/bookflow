import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PHONE_REGEX } from '../clients/clients.dto';

export class AvailabilityQueryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({ example: '2026-12-01', description: 'Local date (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be formatted YYYY-MM-DD' })
  date: string;
}

export class BookingClientDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: '+54 379 4501234' })
  @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @ApiProperty({
    example: '2026-12-01T12:00:00.000Z',
    description: 'Slot start as returned by the availability endpoint',
  })
  @IsISO8601({ strict: true })
  startsAt: string;

  @ApiProperty({ type: BookingClientDto })
  @ValidateNested()
  @Type(() => BookingClientDto)
  client: BookingClientDto;

  @ApiPropertyOptional({ example: 'First time here' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
