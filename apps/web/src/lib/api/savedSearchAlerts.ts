import { apiFetch } from './client';
import type { PropertyFilters } from './types';

/**
 * Tipos del cliente HTTP, espejo del contrato real expuesto por
 * apps/api/src/saved-search-alerts (change `saved-search-alerts`). Modulo
 * autocontenido, igual que apps/web/src/lib/api/savedPropertyLists.ts.
 */

/** Espejo de CreateAlertResult (apps/api/.../saved-search-alerts.service.ts). */
export interface SavedSearchAlertCreated {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'unsubscribed';
}

/** Espejo de ConfirmAlertResult. */
export interface SavedSearchAlertConfirmResult {
  status: 'pending' | 'active' | 'unsubscribed';
  message: string;
}

/** Espejo de UnsubscribeAlertResult. */
export interface SavedSearchAlertUnsubscribeResult {
  alreadyUnsubscribed: boolean;
  message: string;
}

// POST /api/v1/saved-search-alerts
export function createSavedSearchAlert(
  email: string,
  criteria: PropertyFilters,
): Promise<SavedSearchAlertCreated> {
  return apiFetch<SavedSearchAlertCreated>('/saved-search-alerts', {
    method: 'POST',
    json: { email, criteria },
  });
}

// GET /api/v1/saved-search-alerts/confirm/:token
export function confirmSavedSearchAlert(token: string): Promise<SavedSearchAlertConfirmResult> {
  return apiFetch<SavedSearchAlertConfirmResult>(`/saved-search-alerts/confirm/${token}`);
}

// GET /api/v1/saved-search-alerts/unsubscribe/:token
export function unsubscribeSavedSearchAlert(token: string): Promise<SavedSearchAlertUnsubscribeResult> {
  return apiFetch<SavedSearchAlertUnsubscribeResult>(`/saved-search-alerts/unsubscribe/${token}`);
}
