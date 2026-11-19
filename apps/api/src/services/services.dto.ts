import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Upper bound for a service price; keeps values far below the 32-bit column limit. */
export const MAX_PRICE = 10_000_000;

export class CreateServiceDto {
  @ApiProperty({ example: 'Classic Haircut' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'Scissor or clipper cut, wash and style.' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @ApiProperty({ example: 30, description: 'Duration in minutes (5–480)' })
  @IsInt()
  @Min(5)
  @Max(480)
  durationMinutes: number;

  @ApiProperty({
    example: 9000,
    description: `Price in whole Argentine pesos (ARS), 0–${MAX_PRICE.toLocaleString('en-US')}`,
  })
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  price: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
