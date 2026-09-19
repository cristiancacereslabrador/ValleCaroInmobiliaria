import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { PropertyType } from '../../properties/entities/property-type.enum';

/**
 * specs/property-valuation-estimator/spec.md:
 * - Requirement "Formulario de tasacion independiente del catalogo
 *   publicado": campos obligatorios son tipo de vivienda, zona (ciudad O
 *   codigo postal - basta con uno de los dos) y superficie. `bedrooms` y
 *   `status` son caracteristicas adicionales usadas cuando estan presentes,
 *   pero el Escenario "Datos obligatorios ausentes" solo exige tipo, zona y
 *   superficie, por lo que aqui se modelan como opcionales.
 * - Reutiliza el enum `PropertyType` de `properties/entities` (no un literal
 *   propio) porque este modulo ya depende de la entidad `Property` en modo
 *   solo lectura (igual que `price-trends`/`nearby-services`).
 * - La regla "ciudad o codigo postal, basta uno" es un chequeo cruzado entre
 *   dos campos opcionales que class-validator no expresa bien de forma
 *   declarativa; se valida explicitamente en el servicio
 *   (PropertyValuationEstimatorService.estimate).
 */
export class EstimateValuationDto {
  @IsEnum(PropertyType)
  type: PropertyType;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsNumber()
  @IsPositive()
  surfaceM2: number;

  /**
   * design.md - Decision 1: comparables con habitaciones +/-1 respecto a
   * este valor. Si no se indica, la seleccion de comparables no filtra por
   * habitaciones (task brief no lo exige como obligatorio).
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  /**
   * Estado del inmueble (texto libre, igual que `Property.status`).
   * design.md - Decision 1 no lo incluye en el criterio de seleccion de
   * comparables (solo tipo/zona/superficie/habitaciones); se acepta y se
   * devuelve en `criteria` como parte de las caracteristicas indicadas, sin
   * usarse para filtrar.
   */
  @IsOptional()
  @IsString()
  status?: string;
}
