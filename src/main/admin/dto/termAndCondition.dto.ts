import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class TermsSectionDto {
  @ApiProperty({ example: 'Account', description: 'Section title' })
  @IsString()
  title: string;

  @ApiProperty({
    example: ['You must create an account to use the platform.'],
    description: 'Section content items',
  })
  @IsArray()
  @IsString({ each: true })
  content: string[];

  @ApiProperty({ example: 1, description: 'Display order' })
  @IsInt()
  order: number;
}

export class CreateTermsAndConditionsDto {
  @ApiProperty({ type: [TermsSectionDto], description: 'Terms sections' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TermsSectionDto)
  sections: TermsSectionDto[];
}

export class UpdateTermsSectionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Account' })
  @IsString()
  title: string;

  @ApiProperty({ example: ['Content item'] })
  @IsArray()
  @IsString({ each: true })
  content: string[];

  @ApiProperty({ example: 1 })
  @IsInt()
  order: number;
}

export class UpdateTermsAndConditionsDto {
  @ApiProperty({ type: [UpdateTermsSectionDto], description: 'Terms sections' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTermsSectionDto)
  sections: UpdateTermsSectionDto[];
}
