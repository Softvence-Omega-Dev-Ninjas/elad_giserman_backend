import { IsOptional, IsString } from 'class-validator';

export class UpdateCustomAppDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCustomAppDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  removeLogo?: string;

  @IsOptional()
  @IsString()
  removeBannerCard?: string;

  @IsOptional()
  @IsString()
  removeBannerPhoto?: string;
}
