export interface NearbyPlace {
  name: string;
  distanceMeters: number;
}

export interface NearbyServicesCategories {
  schools: NearbyPlace[];
  transitStops: NearbyPlace[];
  supermarkets: NearbyPlace[];
}

/**
 * nearby-services spec:
 * - Requirement "Consulta de puntos de interes cercanos", Scenario
 *   "Propiedad sin coordenadas": `available: false, reason: 'no-coordinates'`.
 * - Requirement "Manejo de error del servicio de puntos de interes",
 *   Scenario "Servicio no disponible": `available: false, reason:
 *   'service-unavailable'`.
 * - Con `available: true`, `categories` siempre esta presente (con arrays
 *   vacios si no hay resultados en una categoria - Scenario "Propiedad sin
 *   puntos de interes en el radio", que no es un error).
 */
export type NearbyServicesResult =
  | { available: true; categories: NearbyServicesCategories }
  | { available: false; reason: 'no-coordinates' | 'service-unavailable' };
