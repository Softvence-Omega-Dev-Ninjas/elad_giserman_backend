import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({
    example: 'john@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOTPDto {
  @ApiProperty({
    example: '1234',
    description: 'OTP code',
  })
  @IsNotEmpty()
  otp: string;

  @ApiPropertyOptional({
    example: 'john@gmail.com',
    description: 'Email address',
  })
  @IsEmail()
  email: string;
}
