import { PaginationDto } from '@/common/dto/pagination.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAllPlansDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by title',
    example: 'Pro Plan',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
