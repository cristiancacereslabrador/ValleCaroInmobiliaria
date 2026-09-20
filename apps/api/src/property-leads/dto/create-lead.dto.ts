import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { LeadIntent, LeadOrigin } from '../lead.enums';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== '')
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsUUID()
  propertyId?: string;

  @IsOptional()
  @IsEnum(LeadOrigin)
  origin?: LeadOrigin;

  @IsOptional()
  @IsEnum(LeadIntent)
  intent?: LeadIntent;

  @IsOptional()
  @IsDateString()
  visitAt?: string;
}
