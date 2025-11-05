import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBusinessProfileDto {
  @ApiProperty({ example: 'The Coffee Spot' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Cozy cafe serving coffee', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Banani, Dhaka' })
  @IsString()
  location: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: '08:00 AM' })
  @IsString()
  openingTime: string;

  @ApiProperty({ example: '10:00 PM' })
  @IsString()
  closingTime: string;
}
