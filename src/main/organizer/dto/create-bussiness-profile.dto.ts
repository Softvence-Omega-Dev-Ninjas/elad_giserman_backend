import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

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

  @ApiProperty({ example: '32e52bf8-c703-4e30-9384-fcacbfc06747' })
  @IsUUID()
  ownerId: string;
}
