import type { GeoPoint } from '../geolocation/point-in-polygon.util';
import { TransportMode } from './transport-mode.enum';

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * design.md - Decision 1: "pre-filtro barato" antes de llamar a la Distance
 * Matrix API. Velocidad maxima CONSERVADORA (km/h) asumida por medio de
 * transporte, usada solo para dimensionar el radio del pre-filtro -
 * deliberadamente mayor que la velocidad media real (p. ej. un coche por
 * autovia, un tren de cercanias) para que el pre-filtro nunca excluya por
 * error una propiedad que la Distance Matrix API si consideraria dentro del
 * tiempo maximo. Solo debe descartar candidatas obviamente fuera de rango
 * (Risks/Trade-offs: "el radio conservador... podria excluir por error
 * alguna propiedad limite" se acepta como aproximacion razonable, pero el
 * riesgo se minimiza siendo generoso aqui, no ajustado).
 */
const CONSERVATIVE_SPEED_KMH: Record<TransportMode, number> = {
  [TransportMode.WALKING]: 6,
  [TransportMode.TRANSIT]: 60,
  [TransportMode.DRIVING]: 120,
};

/**
 * Radio (metros) del pre-filtro para un tiempo maximo y medio de transporte
 * dados. Funcion pura (tasks.md 1.2).
 */
export function getConservativeRadiusMeters(
  maxDurationMinutes: number,
  transportMode: TransportMode,
): number {
  const speedKmh = CONSERVATIVE_SPEED_KMH[transportMode];
  const speedMetersPerMinute = (speedKmh * 1000) / 60;
  return speedMetersPerMinute * maxDurationMinutes;
}

/**
 * Caja delimitadora (lat/lng) alrededor de un centro dado un radio en
 * metros. Aproximacion por grados (no exacta cerca de los polos, suficiente
 * para el pre-filtro de este proyecto). Funcion pura.
 */
export function getBoundingBox(center: GeoPoint, radiusMeters: number): BoundingBox {
  const latDeltaDeg = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);

  const latRad = (center.lat * Math.PI) / 180;
  const lngDeltaDeg =
    (radiusMeters / (EARTH_RADIUS_METERS * Math.cos(latRad))) * (180 / Math.PI);

  return {
    minLat: center.lat - latDeltaDeg,
    maxLat: center.lat + latDeltaDeg,
    minLng: center.lng - lngDeltaDeg,
    maxLng: center.lng + lngDeltaDeg,
  };
}

export function isWithinBoundingBox(point: GeoPoint, box: BoundingBox): boolean {
  return (
    point.lat >= box.minLat &&
    point.lat <= box.maxLat &&
    point.lng >= box.minLng &&
    point.lng <= box.maxLng
  );
}
