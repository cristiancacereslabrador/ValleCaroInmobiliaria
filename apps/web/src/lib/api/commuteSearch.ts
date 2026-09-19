import { apiFetch } from './client';
import type { Property, PropertyFilters } from './types';

/**
 * Espejo de apps/api/src/commute-search (modulo aislado, endpoint propio
 * `GET /api/v1/commute-search` - no forma parte del contrato de
 * `PropertyFilters`/`listProperties`).
 */
export enum TransportMode {
  DRIVING = 'driving',
  TRANSIT = 'transit',
  WALKING = 'walking',
}

/**
 * Subconjunto de PropertyFilters aceptado ademas por commute-search (mismos
 * nombres de campo; sin `area`, no combinable con la busqueda por trayecto
 * en esta version - ver apps/api/src/commute-search/dto/query-commute-search.dto.ts).
 */
export type CommuteCatalogFilters = Omit<PropertyFilters, 'area'>;

export interface CommuteSearchParams extends CommuteCatalogFilters {
  destinationAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  transportMode: TransportMode;
  maxDurationMinutes: number;
}

/** Property + tiempo de trayecto estimado hasta el destino, en segundos. */
export type PropertyWithCommute = Property & { commuteDurationSeconds: number };

export type CommuteSearchResult =
  | { available: true; properties: PropertyWithCommute[] }
  | { available: false; reason: 'service-unavailable' };

function buildQueryString(params: CommuteSearchParams): string {
  const qs = new URLSearchParams();

  if (params.destinationAddress) qs.set('destinationAddress', params.destinationAddress);
  if (params.destinationLat !== undefined) qs.set('destinationLat', String(params.destinationLat));
  if (params.destinationLng !== undefined) qs.set('destinationLng', String(params.destinationLng));
  qs.set('transportMode', params.transportMode);
  qs.set('maxDurationMinutes', String(params.maxDurationMinutes));

  if (params.type) qs.set('type', params.type);
  if (params.operationType) qs.set('operationType', params.operationType);
  if (params.minPrice !== undefined) qs.set('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qs.set('maxPrice', String(params.maxPrice));
  if (params.hasElevator !== undefined) qs.set('hasElevator', String(params.hasElevator));
  if (params.groundFloor !== undefined) qs.set('groundFloor', String(params.groundFloor));
  if (params.needsRenovation !== undefined) qs.set('needsRenovation', String(params.needsRenovation));

  return `?${qs.toString()}`;
}

// GET /api/v1/commute-search
export function searchByCommute(params: CommuteSearchParams): Promise<CommuteSearchResult> {
  return apiFetch<CommuteSearchResult>(`/commute-search${buildQueryString(params)}`);
}
