import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateSpinDto {
  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  spinValue1?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  probablity?: number;

  @ApiProperty({ example: '10% discount on pizza or free a coke' })
  @IsOptional()
  @IsString()
  useCase?: string;
}

export class UpdateSpinDto {
  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  spinValue1?: number;

  @ApiProperty({ example: 10 })
  @IsOptional()
  @IsInt()
  probablity?: number;

  @ApiProperty({ example: '10% discount on pizza or free a coke' })
  @IsOptional()
  @IsString()
  useCase?: string;
}
