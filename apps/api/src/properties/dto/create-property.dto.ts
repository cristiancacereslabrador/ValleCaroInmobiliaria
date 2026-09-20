import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PropertyType } from '../entities/property-type.enum';
import { OperationType } from '../entities/operation-type.enum';
import { ListingStatus } from '../entities/listing-status.enum';

export class CreatePropertyDto {
  @IsEnum(PropertyType, {
    message: `type debe ser uno de: ${Object.values(PropertyType).join(', ')}`,
  })
  type: PropertyType;

  @IsEnum(OperationType, {
    message: `operationType debe ser uno de: ${Object.values(OperationType).join(', ')}`,
  })
  operationType: OperationType;

  @IsOptional()
  @IsEnum(ListingStatus)
  listingStatus?: ListingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  surfaceM2?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  landSurfaceM2?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  parkingSpaces?: number;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  constructionYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  municipality?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  parish?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  urbanization?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  hasElevator?: boolean;

  @IsOptional()
  @IsBoolean()
  needsRenovation?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPowerPlant?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCistern?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWaterWell?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDirectGas?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSecurity?: boolean;

  @IsOptional()
  @IsBoolean()
  isGatedCommunity?: boolean;

  @IsOptional()
  @IsBoolean()
  isFurnished?: boolean;

  @IsOptional()
  @IsBoolean()
  isSemiFurnished?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAirConditioning?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPool?: boolean;

  @IsOptional()
  @IsBoolean()
  hasGarden?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;
}
