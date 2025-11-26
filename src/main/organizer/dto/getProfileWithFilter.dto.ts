import { ApiProperty } from '@nestjs/swagger';
import { ProfileType } from '@prisma';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class ProfileFilter {
  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  limit: number;
  @ApiProperty({
    description: 'Search by profile title or name',
    required: false,
    example: 'Pizza Place',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Choose the profile type',
    enum: ProfileType,
    enumName: 'ProfileType',
    required: false,
  })
  @IsEnum(ProfileType)
  @IsOptional()
  profileType?: ProfileType;
}
