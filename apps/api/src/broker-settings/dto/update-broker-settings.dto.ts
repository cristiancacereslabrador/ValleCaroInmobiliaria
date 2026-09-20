import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateBrokerSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slogan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  advisorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  advisorTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  instagram?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  facebook?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tiktok?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  officeAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  secondaryColor?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  mapCenterLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  mapCenterLng?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  mapZoom?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverageText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  businessHours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  footerLegal?: string;

  @IsOptional()
  @IsString()
  aboutText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  testimonials?: string;
}
