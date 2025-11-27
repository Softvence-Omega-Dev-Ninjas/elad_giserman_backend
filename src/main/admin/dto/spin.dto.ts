import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class CreateSpinDto {
  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue1?: number;
}

export class UpdateSpinDto {
  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue1?: number;
}
