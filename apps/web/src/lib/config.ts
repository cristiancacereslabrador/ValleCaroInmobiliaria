/**
 * Acceso centralizado a la configuracion publica del frontend (variables
 * `NEXT_PUBLIC_*`, ver apps/web/.env.example). `NEXT_PUBLIC_*` se referencia
 * de forma directa y estatica (no via indexado dinamico) para que Next.js
 * pueda inlinearla en el bundle del cliente en build time.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api/v1';

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL;
  return value && value.length > 0 ? value.replace(/\/$/, '') : DEFAULT_API_BASE_URL;
}

/**
 * design.md - Decision 4: los medios (fotos/videos) se sirven como estaticos
 * bajo `/media/properties` en la raiz del servidor de la API (NO bajo
 * `/api/v1`, ver apps/api/src/app.module.ts - ServeStaticModule). `property.
 * coverPhotoUrl` / `propertyMedia.url` llegan como rutas relativas a esa
 * raiz (p. ej. "/media/properties/<id>/<archivo>"), por lo que hace falta el
 * origen del servidor de la API sin el sufijo "/api/v1" para construir una
 * URL completa que el navegador pueda cargar.
 */
export function getMediaBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/v1$/, '');
}

export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${getMediaBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`;
}

export function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY ?? '';
}
