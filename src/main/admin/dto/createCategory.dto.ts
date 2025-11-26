import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CategoryDto {
  @ApiProperty({
    example: 'Food & Beverages',
    description: 'BAR',
    required: true,
  })
  @IsString()
  name: string;
}
