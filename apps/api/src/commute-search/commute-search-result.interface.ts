import type { PropertyWithCover } from '../properties/properties.service';

export type PropertyWithCommute = PropertyWithCover & { commuteDurationSeconds: number };

/**
 * spec, Requirement "Manejo de error del servicio de cálculo de trayectos":
 * cuando el servicio externo de trayectos no está disponible, se informa de
 * forma controlada (`available: false`) en vez de romper la búsqueda con un
 * error HTTP genérico - mismo patrón que `NearbyServicesResult`
 * (nearby-services/nearby-place.interface.ts), que ya resuelve el mismo tipo
 * de fallo de una API externa de Google de la misma forma en este proyecto.
 */
export type CommuteSearchResult =
  | { available: true; properties: PropertyWithCommute[] }
  | { available: false; reason: 'service-unavailable' };
