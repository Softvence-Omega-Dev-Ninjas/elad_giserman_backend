import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetOffersDto {
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

export class GetOffersDto2 {

  @ApiPropertyOptional({ description: 'search offer', type: String })
  @IsOptional()
  @IsString()
  search:string
  
  @ApiPropertyOptional({ description: 'Status of the offer', type: String })
  @IsOptional()
  @IsString()
  status: string;
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
