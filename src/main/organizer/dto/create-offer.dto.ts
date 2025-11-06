import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ example: '50% Off Summer Sale' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Discounts on all items', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
