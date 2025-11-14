import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'Admin can update user status',
    enum: UserStatus,
    enumName: 'user status',
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
