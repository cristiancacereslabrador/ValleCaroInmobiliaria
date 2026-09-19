import { Type } from 'class-transformer';
import { IsDefined, IsEmail, ValidateNested } from 'class-validator';
import { QueryPropertiesDto } from '../../properties/dto/query-properties.dto';

/**
 * spec.md, Requirement "Guardar una busqueda con alerta por email".
 * `criteria` reutiliza literalmente `QueryPropertiesDto` (el mismo DTO que
 * valida los filtros de `GET /properties`) en vez de duplicar sus reglas:
 * design.md - Decision 1 - evita que esta alerta diverja del listado cada
 * vez que se anade un filtro nuevo al catalogo.
 */
export class CreateSavedSearchAlertDto {
  @IsEmail({}, { message: 'El email indicado no tiene un formato válido.' })
  email: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => QueryPropertiesDto)
  criteria: QueryPropertiesDto;
}
