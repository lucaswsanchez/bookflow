import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../common/decorators';

/** 6–20 characters of digits, spaces, dashes and parentheses (optional leading +), with at least 6 digits. */
export const PHONE_REGEX = /^(?=(?:\D*\d){6})\+?[0-9 ()-]{6,20}$/;

export class CreateClientDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @Trim()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: '+54 379 4501234' })
  @Trim()
  @Matches(PHONE_REGEX, { message: 'phone must be a valid phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'juan.perez@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Prefers short sides' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}
