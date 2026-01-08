import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBussinessOwnerDTO {
  @ApiProperty({
    example: 'bussiness@gmail.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'bussiness',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
