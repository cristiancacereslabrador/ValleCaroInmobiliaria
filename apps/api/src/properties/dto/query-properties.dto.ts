import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { PropertyType } from '../entities/property-type.enum';
import { OperationType } from '../entities/operation-type.enum';
import { ListingStatus } from '../entities/listing-status.enum';
import { IsValidPolygon } from './is-valid-polygon.validator';
import type { GeoPoint } from '../../geolocation/point-in-polygon.util';

function toBooleanFilter({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class QueryPropertiesDto {
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

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
  @MaxLength(120)
  urbanization?: string;

  @IsOptional()
  @Transform(toBooleanFilter)
  @IsBoolean()
  hasElevator?: boolean;

  @IsOptional()
  @Transform(toBooleanFilter)
  @IsBoolean()
  groundFloor?: boolean;

  @IsOptional()
  @Transform(toBooleanFilter)
  @IsBoolean()
  needsRenovation?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sortBy?: 'newest' | 'price_asc' | 'price_desc';

  @IsOptional()
  @IsEnum(ListingStatus)
  listingStatus?: ListingStatus;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  @IsValidPolygon()
  area?: GeoPoint[];
}
