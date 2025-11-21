import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class GetReviewDto {
  @ApiPropertyOptional({
    description: 'Search term for user name',
    type: String,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of users per page',
    type: Number,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
