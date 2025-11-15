import { IsString, IsArray, IsOptional, ArrayNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTermsAndConditionsDto {
  @ApiProperty({ example: 'account_123', description: 'Account identifier' })
  @IsString()
  account: string;

  @ApiProperty({ example: ['basic', 'premium'], description: 'Subscription types' })
  @IsArray()
  subscription: string[];

  @ApiProperty({ example: ['offer1', 'offer2'], description: 'Offers and redemptions' })
  @IsArray()
  offerAndRedemtions: string[];

  @ApiProperty({ example: ['reservation1'], description: 'Reservations' })
  @IsArray()
  reservations: string[];

  @ApiProperty({ example: ['business1', 'business2'], description: 'Businesses' })
  @IsArray()
  businesses: string[];

  @ApiProperty({ example: ['ADMIN'], description: 'Admin rights' })
  @IsArray()
  adminRight: string[];

  @ApiProperty({ example: 'Your data and privacy policy text', description: 'Data and policy information' })
  @IsString()
  dataAndPolicy: string;

  @ApiProperty({ example: 'Liability text', description: 'Liability information' })
  @IsString()
  liability: string;

  @ApiProperty({ example: 'Governing law text', description: 'Governing law' })
  @IsString()
  governingLaw: string;
}

export class UpdateTermsAndConditionsDto {
  @ApiProperty({ example: 'account_123', description: 'Account identifier', required: false })
  @IsOptional()
  @IsString()
  account?: string;

  @ApiProperty({ example: ['basic', 'premium'], description: 'Subscription types', required: false })
  @IsOptional()
  @IsArray()
  subscription?: string[];

  @ApiProperty({ example: ['offer1', 'offer2'], description: 'Offers and redemptions', required: false })
  @IsOptional()
  @IsArray()
  offerAndRedemtions?: string[];

  @ApiProperty({ example: ['reservation1'], description: 'Reservations', required: false })
  @IsOptional()
  @IsArray()
  reservations?: string[];

  @ApiProperty({ example: ['business1', 'business2'], description: 'Businesses', required: false })
  @IsOptional()
  @IsArray()
  businesses?: string[];

  @ApiProperty({ example: ['ADMIN'], description: 'Admin rights', required: false })
  @IsOptional()
  @IsArray()
  adminRight?: string[];

  @ApiProperty({ example: 'Your data and privacy policy text', description: 'Data and policy information', required: false })
  @IsOptional()
  @IsString()
  dataAndPolicy?: string;

  @ApiProperty({ example: 'Liability text', description: 'Liability information', required: false })
  @IsOptional()
  @IsString()
  liability?: string;

  @ApiProperty({ example: 'Governing law text', description: 'Governing law', required: false })
  @IsOptional()
  @IsString()
  governingLaw?: string;
}
