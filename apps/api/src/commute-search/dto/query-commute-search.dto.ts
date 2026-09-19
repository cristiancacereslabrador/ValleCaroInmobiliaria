import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PropertyType } from '../../properties/entities/property-type.enum';
import { OperationType } from '../../properties/entities/operation-type.enum';
import { TransportMode } from '../transport-mode.enum';

/**
 * Igual que en QueryPropertiesDto: convierte 'true'/'false' de query string a
 * booleano real, dejando pasar cualquier otro valor para que `@IsBoolean()`
 * lo rechace.
 */
function toBooleanFilter({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/**
 * commute-search spec, Requirement "Búsqueda por tiempo máximo de trayecto a
 * un destino". El destino se acepta como dirección (`destinationAddress`,
 * geocodificada con GeocodingService) o como coordenadas explícitas
 * (`destinationLat`/`destinationLng`) - spec: "un destino (dirección o
 * coordenadas)". Al menos una de las dos formas es obligatoria; esa
 * comprobación cruzada se hace en CommuteSearchService (no expresable de
 * forma simple con un unico decorador de class-validator sobre campos
 * opcionales independientes), lanzando el mismo error de "destino no
 * válido" que un destino no geocodificable.
 *
 * Incluye ademas el mismo subconjunto de filtros de catalogo que
 * QueryPropertiesDto (sin `area`: combinar poligono + trayecto no forma
 * parte de esta spec) para poder cumplir el escenario "Combinación con
 * otros filtros del catálogo" sin depender de un cambio en el controller de
 * `properties` (aislamiento del modulo, ver AGENTS/orquestador).
 */
export class QueryCommuteSearchDto {
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destinationLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  destinationLng?: number;

  @IsEnum(TransportMode)
  transportMode: TransportMode;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxDurationMinutes: number;

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
}
