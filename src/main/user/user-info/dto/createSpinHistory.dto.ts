import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class SpinHistoryDto {
  @ApiProperty({ description: 'Result', example: '5' })
  @IsNumber()
  @IsNotEmpty()
  result: number;
}
