import { ApiProperty } from '@nestjs/swagger';
import { MemberShip } from '@prisma';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class PlatformFilter {
  @ApiProperty({
    description: 'Search by email, name, or phone',
    required: false,
    example: 'john@example.com',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filter by membership type',
    enum: MemberShip,
    enumName: 'MemberShip',
    required: false,
  })
  @IsEnum(MemberShip)
  @IsOptional()
  userType?: MemberShip;

  @ApiProperty({
    description: 'Filter by date (ISO format)',
    required: false,
    example: '2025-11-11',
  })
  @IsDateString()
  @IsOptional()
  date?: string;
}
