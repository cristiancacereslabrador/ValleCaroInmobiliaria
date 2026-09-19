/**
 * commute-search spec, Requirement "Búsqueda por tiempo máximo de trayecto a
 * un destino": medio de transporte, uno de coche/transporte público/a pie
 * (proposal.md - What Changes). Los valores coinciden literalmente con el
 * parametro `mode` de la Google Distance Matrix API para poder reenviarlos
 * sin traduccion (ver DistanceMatrixService).
 */
export enum TransportMode {
  DRIVING = 'driving',
  TRANSIT = 'transit',
  WALKING = 'walking',
}
