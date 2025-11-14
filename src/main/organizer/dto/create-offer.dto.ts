import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class CreateOfferDto {
  @ApiProperty({ example: '50% Off Summer Sale' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Discounts on all items', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({description:"here will go the code for offer ", example:"PZ20"})
  @IsString()
  code :string

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: '2024-12-31T23:59:59.999Z' })
  @IsDate()
  expiresAt:Date
}
