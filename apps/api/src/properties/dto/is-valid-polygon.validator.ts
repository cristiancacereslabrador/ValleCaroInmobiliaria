import { registerDecorator, ValidationOptions } from 'class-validator';
import type { GeoPoint } from '../../geolocation/point-in-polygon.util';

function isValidVertex(vertex: unknown): vertex is GeoPoint {
  if (typeof vertex !== 'object' || vertex === null) {
    return false;
  }

  const { lat, lng } = vertex as Record<string, unknown>;

  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * property-geolocation spec, Requirement "Busqueda de propiedades por area
 * dibujada en el mapa": el poligono debe tener al menos 3 vertices, cada uno
 * con latitud/longitud dentro de rango. Scenario "Poligono invalido": menos
 * de 3 vertices o coordenadas fuera de rango se rechaza informando que el
 * area no es valida.
 */
export function IsValidPolygon(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPolygon',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return Array.isArray(value) && value.length >= 3 && value.every(isValidVertex);
        },
        defaultMessage(): string {
          return 'area debe ser un poligono valido: al menos 3 vertices {lat, lng}, con lat en [-90, 90] y lng en [-180, 180]';
        },
      },
    });
  };
}
