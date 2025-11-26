import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfileType } from '@prisma';

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
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ example: '08:00 AM' })
  @IsString()
  openingTime: string;

  @ApiProperty({ example: '10:00 PM' })
  @IsString()
  closingTime: string;

  @ApiProperty({
    description: 'chose profile type',
  })
  @IsString()
  @IsNotEmpty()
  profileType: ProfileType;
  @ApiProperty({ example: 'categoryId123' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
