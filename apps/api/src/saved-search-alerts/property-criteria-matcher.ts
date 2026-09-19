import { Property } from '../properties/entities/property.entity';
import { QueryPropertiesDto } from '../properties/dto/query-properties.dto';
import { isPointInPolygon } from '../geolocation/point-in-polygon.util';

/**
 * Evalua si UNA propiedad ya cargada en memoria cumple los criterios de una
 * alerta (spec.md, Requirement "Notificacion de nuevas coincidencias" /
 * "Notificacion de cambio de precio"). Instrucciones de la tarea: reutilizar
 * exactamente la misma logica de filtrado que `PropertiesService.findAll`
 * (apps/api/src/properties/properties.service.ts), aplicada a una unica
 * propiedad en vez de una consulta SQL - este archivo replica, criterio por
 * criterio, el mismo predicado que esa funcion arma con `QueryBuilder`, sin
 * tocar `properties.service.ts` (modulo aislado, ver CLAUDE.md de este
 * change).
 *
 * Los filtros booleanos tri-estado reproducen la semantica SQL exacta de
 * `findAll`: una columna `NULL` (atributo "no indicado") NO coincide ni con
 * `true` ni con `false` explicitos (en SQL, `NULL = true` y `NULL = false`
 * son ambos `NULL`/desconocido, lo que excluye la fila en cualquiera de los
 * dos casos) - de ahi la comparacion estricta `!==` en vez de negar un
 * booleano.
 */
export function propertyMatchesCriteria(
  property: Property,
  criteria: QueryPropertiesDto,
): boolean {
  if (criteria.type && property.type !== criteria.type) {
    return false;
  }

  if (criteria.operationType && property.operationType !== criteria.operationType) {
    return false;
  }

  if (criteria.minPrice !== undefined && Number(property.price) < criteria.minPrice) {
    return false;
  }

  if (criteria.maxPrice !== undefined && Number(property.price) > criteria.maxPrice) {
    return false;
  }

  if (
    criteria.minBedrooms !== undefined &&
    (property.bedrooms === null || property.bedrooms < criteria.minBedrooms)
  ) {
    return false;
  }

  if (criteria.hasElevator !== undefined && property.hasElevator !== criteria.hasElevator) {
    return false;
  }

  if (criteria.groundFloor !== undefined) {
    // "Planta baja" no es una columna propia (se deriva de `floor === 0`,
    // igual que findAll). Un `floor` no indicado (`null`) no coincide ni con
    // groundFloor=true ni con groundFloor=false, igual que `floor <> 0`/
    // `floor = 0` excluyen NULL en SQL.
    if (property.floor === null) {
      return false;
    }
    const isGroundFloor = property.floor === 0;
    if (criteria.groundFloor !== isGroundFloor) {
      return false;
    }
  }

  if (criteria.needsRenovation !== undefined && property.needsRenovation !== criteria.needsRenovation) {
    return false;
  }

  if (criteria.state && (property.state ?? '').trim().toLowerCase() !== criteria.state.trim().toLowerCase()) {
    return false;
  }

  if (
    criteria.municipality &&
    (property.municipality ?? '').trim().toLowerCase() !== criteria.municipality.trim().toLowerCase()
  ) {
    return false;
  }

  if (criteria.area !== undefined) {
    // Solo puede estar "dentro" de un area una propiedad con coordenadas
    // (mismo criterio que findAll).
    if (property.latitude === null || property.longitude === null) {
      return false;
    }
    const withinArea = isPointInPolygon(
      { lat: Number(property.latitude), lng: Number(property.longitude) },
      criteria.area,
    );
    if (!withinArea) {
      return false;
    }
  }

  return true;
}
