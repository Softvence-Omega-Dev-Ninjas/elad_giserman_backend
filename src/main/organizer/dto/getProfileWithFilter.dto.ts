import { ApiProperty } from '@nestjs/swagger';
import { ProfileType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ProfileFilter {
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
