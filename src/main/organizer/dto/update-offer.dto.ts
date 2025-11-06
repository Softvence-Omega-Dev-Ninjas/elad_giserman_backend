import { PartialType } from '@nestjs/mapped-types';
import { CreateOfferDto } from './create-offer.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  @ApiProperty({ example: 'Updated Offer Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated offer description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
