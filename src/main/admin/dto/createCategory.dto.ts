import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CategoryDto {
  @ApiProperty({
    example: 'Food & Beverages',
    description: 'BAR',
    required: true,
  })
  @IsString()
  name: string;
}

export class updateCategoryDto {
  @ApiProperty({
    example: 'Food & Beverages',
    description: 'BAR',
    required: false,
  })
  @IsString()
  @IsOptional()
  name: string;
}