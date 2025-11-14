import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateUserInfoDto {
  @ApiProperty({
    description: 'Change your name',
    example: 'Milon Hossain',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Change your phone number',
    example: '4958485984',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Upload your profile photo',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  profileImage?: any;
}
