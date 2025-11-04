import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class ApplyRoleDto {
  @ApiProperty({
    description: 'Role the user wants to apply for',
    enum: UserRole,
    example: UserRole.ORGANIZER,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
