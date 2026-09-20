import { apiFetch, apiUpload } from './client';
import type { PropertyMedia } from './types';

// GET /api/v1/properties/:id/media
export function listMedia(propertyId: string): Promise<PropertyMedia[]> {
  return apiFetch<PropertyMedia[]>(`/properties/${propertyId}/media`);
}

/**
 * POST /api/v1/properties/:id/media (multipart/form-data, campo "file").
 * `mediaType` es el unico campo opcional adicional que soporta el backend
 * (property-media.controller.ts): sin el, el tipo se infiere por extension
 * (photo/video) como siempre; con `mediaType: 'tour360'` se pide
 * explicitamente subir la imagen como tour virtual 360 en vez de foto
 * (property-virtual-tours - tasks.md 1.2/2.2).
 */
export function uploadMedia(
  propertyId: string,
  file: File,
  mediaType?: 'tour360',
  onProgress?: (percent: number) => void,
): Promise<PropertyMedia> {
  const form = new FormData();
  form.append('file', file);
  if (mediaType) {
    form.append('type', mediaType);
  }
  return apiUpload<PropertyMedia>(`/properties/${propertyId}/media`, form, { onProgress });
}

// DELETE /api/v1/properties/:id/media/:mediaId
export function deleteMedia(propertyId: string, mediaId: string): Promise<void> {
  return apiFetch<void>(`/properties/${propertyId}/media/${mediaId}`, { method: 'DELETE' });
}

// PATCH /api/v1/properties/:id/media/:mediaId/cover
export function markCoverPhoto(propertyId: string, mediaId: string): Promise<PropertyMedia> {
  return apiFetch<PropertyMedia>(`/properties/${propertyId}/media/${mediaId}/cover`, {
    method: 'PATCH',
  });
}
