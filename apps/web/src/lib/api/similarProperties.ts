import { apiFetch } from './client';
import type { Property } from './types';

/**
 * Espejo del contrato de apps/api/src/similar-properties
 * (SimilarPropertiesService.getSimilar): devuelve propiedades con la misma
 * forma que el resto del catalogo (`Property`, incluido `coverPhotoUrl`).
 */

// GET /api/v1/properties/:id/similar
export function getSimilarProperties(propertyId: string): Promise<Property[]> {
  return apiFetch<Property[]>(`/properties/${propertyId}/similar`);
}
