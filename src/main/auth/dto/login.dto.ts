import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'strongPassword123',
    description: 'User password (min 6 characters)',
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class GoogleLoginDto {
  @ApiProperty({
    description: 'ID token from Google Sign-In / Firebase',
    example: 'idToken',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
