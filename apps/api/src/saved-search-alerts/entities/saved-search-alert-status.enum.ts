/**
 * saved-search-alerts spec.md - ciclo de vida de una alerta:
 * - `pending`: creada, esperando confirmacion por email (doble opt-in). Nunca
 *   se considera para evaluar coincidencias, independientemente de si su
 *   `confirmationExpiresAt` ya paso o no (Requirement "Confirmacion de la
 *   alerta por email", Scenario "Alerta nunca confirmada").
 * - `active`: confirmada; puede generar notificaciones de nueva coincidencia
 *   o de cambio de precio.
 * - `unsubscribed`: dada de baja (via el enlace de baja de cualquier email
 *   relacionado); estado terminal, no vuelve a `active` ni `pending`.
 */
export enum SavedSearchAlertStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
}
