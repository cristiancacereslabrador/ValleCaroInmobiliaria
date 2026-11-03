import { ApiError, apiFetch, apiUpload } from './client';
import type { PropertyMedia } from './types';

/** A partir de este tamaño se sube por trozos reanudables. */
export const RESUMABLE_UPLOAD_MIN_BYTES = 8 * 1024 * 1024;
const CHUNK_TIMEOUT_MS = 5 * 60 * 1000;
const CHUNK_ATTEMPTS = 5;

interface UploadSessionStatus {
  uploadId: string;
  received: number;
  size: number;
  chunkSize: number;
}

// Sesion abierta por archivo, para reanudar si se reintenta el mismo archivo
// (tambien tras recargar la pagina, si se vuelve a elegir).
const sessionsInMemory = new Map<string, string>();

function sessionKey(propertyId: string, file: File): string {
  return `media-upload:${propertyId}:${file.name}:${file.size}:${file.lastModified}`;
}

function rememberSession(key: string, uploadId: string | null): void {
  if (uploadId) sessionsInMemory.set(key, uploadId);
  else sessionsInMemory.delete(key);
  try {
    if (uploadId) window.localStorage.setItem(key, uploadId);
    else window.localStorage.removeItem(key);
  } catch {
    // Sin almacenamiento (modo privado): basta con la memoria.
  }
}

function recalledSession(key: string): string | null {
  const inMemory = sessionsInMemory.get(key);
  if (inMemory) return inMemory;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function receivedFromConflict(err: unknown): number | null {
  if (err instanceof ApiError && err.status === 409) {
    const received = (err.details as { received?: unknown } | undefined)?.received;
    return typeof received === 'number' ? received : null;
  }
  return null;
}

/**
 * Sube un archivo por trozos (apps/api upload-sessions.controller.ts). Si la
 * conexion se corta, al reintentar pregunta al servidor cuanto llego y sigue
 * desde ahi: no se vuelve a mandar lo ya subido.
 */
export async function uploadMediaResumable(
  propertyId: string,
  file: File,
  mediaType?: 'tour360',
  onProgress?: (percent: number) => void,
): Promise<PropertyMedia> {
  const base = `/properties/${propertyId}/media/uploads`;
  const key = sessionKey(propertyId, file);

  let session: UploadSessionStatus | null = null;
  const previous = recalledSession(key);
  if (previous) {
    try {
      session = await apiFetch<UploadSessionStatus>(`${base}/${previous}`);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) throw err;
      rememberSession(key, null);
    }
  }
  if (!session || session.size !== file.size) {
    session = await apiFetch<UploadSessionStatus>(base, {
      method: 'POST',
      json: {
        filename: file.name || 'archivo',
        mimetype: file.type || undefined,
        size: file.size,
        ...(mediaType ? { type: mediaType } : {}),
      },
    });
    rememberSession(key, session.uploadId);
  }

  const { uploadId, chunkSize } = session;
  let received = session.received;
  const report = (bytes: number) => onProgress?.(Math.min(100, Math.floor((bytes / file.size) * 100)));
  report(received);

  let failures = 0;
  while (received < file.size) {
    const chunk = file.slice(received, Math.min(file.size, received + chunkSize));
    try {
      const status = await apiUpload<UploadSessionStatus>(`${base}/${uploadId}?offset=${received}`, chunk, {
        method: 'PUT',
        timeoutMs: CHUNK_TIMEOUT_MS,
        onBytes: (loaded) => report(received + loaded),
      });
      received = status.received;
      failures = 0;
    } catch (err) {
      const fromConflict = receivedFromConflict(err);
      if (fromConflict !== null) {
        received = fromConflict;
        continue;
      }
      if (err instanceof ApiError && err.status < 500 && err.status !== 408 && err.status !== 429) {
        throw err;
      }
      failures += 1;
      if (failures >= CHUNK_ATTEMPTS || document.visibilityState === 'hidden') {
        throw err;
      }
      await sleep(1000 * failures);
      // El trozo pudo llegar a medias: se pregunta cuanto hay antes de seguir.
      received = (await apiFetch<UploadSessionStatus>(`${base}/${uploadId}`)).received;
    }
    report(received);
  }

  const media = await apiFetch<PropertyMedia>(`${base}/${uploadId}/complete`, { method: 'POST' });
  rememberSession(key, null);
  return media;
}

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
