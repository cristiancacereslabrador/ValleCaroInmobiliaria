import { apiFetch } from './client';

/**
 * Espejo del contrato de apps/api/src/nearby-services (ver
 * nearby-place.interface.ts en ese modulo).
 */
export interface NearbyPlace {
  name: string;
  distanceMeters: number;
}

export interface NearbyServicesCategories {
  schools: NearbyPlace[];
  transitStops: NearbyPlace[];
  supermarkets: NearbyPlace[];
}

export type NearbyServicesResult =
  | { available: true; categories: NearbyServicesCategories }
  | { available: false; reason: 'no-coordinates' | 'service-unavailable' };

// GET /api/v1/properties/:id/nearby-services
export function getNearbyServices(propertyId: string): Promise<NearbyServicesResult> {
  return apiFetch<NearbyServicesResult>(`/properties/${propertyId}/nearby-services`);
}
