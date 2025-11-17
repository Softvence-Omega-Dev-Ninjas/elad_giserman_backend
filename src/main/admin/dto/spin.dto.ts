import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class CreateSpinDto {
  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue1?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue2?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue3?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue4?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue5?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue6?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue7?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue8?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue9?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue10?: number;
}

export class UpdateSpinDto {
  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue1?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue2?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue3?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue4?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue5?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue6?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue7?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue8?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue9?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue10?: number;
}
