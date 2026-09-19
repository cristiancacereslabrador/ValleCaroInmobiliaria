import type { GeoPoint } from './point-in-polygon.util';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Distancia aproximada en metros entre dos coordenadas (formula de
 * haversine). Funcion pura, sin dependencias externas.
 *
 * nearby-services spec, Requirement "Consulta de puntos de interes cercanos":
 * la Nearby Search de Google Places no devuelve la distancia al punto de
 * origen, solo las coordenadas de cada resultado - se calcula aqui
 * ("distancia aproximada", design.md Decision 1).
 */
export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);

  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);

  const h =
    sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;

  const angularDistance = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return Math.round(EARTH_RADIUS_METERS * angularDistance);
}
