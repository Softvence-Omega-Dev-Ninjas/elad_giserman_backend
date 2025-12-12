import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class ReservationFilter {
  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Search by profile title or name',
    required: false,
    example: 'Pizza Place',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter reservations by date (YYYY-MM-DD)',
    required: false,
    example: '2025-12-12',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
