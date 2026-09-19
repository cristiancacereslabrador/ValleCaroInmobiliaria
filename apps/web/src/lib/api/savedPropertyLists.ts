import { apiFetch } from './client';
import type { Property } from './types';

/**
 * Tipos del cliente HTTP, espejo del contrato real expuesto por
 * apps/api/src/saved-property-lists (change `saved-property-lists`). Modulo
 * autocontenido: no se mezcla con apps/web/src/lib/api/properties.ts.
 */

/** Espejo de ManagementListView (apps/api/.../saved-property-lists.service.ts): incluye ambos identificadores. */
export interface SavedPropertyListManagementView {
  id: string;
  name: string;
  managementToken: string;
  shareToken: string;
  properties: Property[];
  createdAt: string;
  updatedAt: string;
}

/** Espejo de PublicListView: nunca incluye managementToken. */
export interface SavedPropertyListPublicView {
  name: string;
  properties: Property[];
}

// POST /api/v1/saved-property-lists
export function createSavedPropertyList(name: string): Promise<SavedPropertyListManagementView> {
  return apiFetch<SavedPropertyListManagementView>('/saved-property-lists', {
    method: 'POST',
    json: { name },
  });
}

// GET /api/v1/saved-property-lists/manage/:managementToken
export function getSavedPropertyListByManagementToken(
  managementToken: string,
): Promise<SavedPropertyListManagementView> {
  return apiFetch<SavedPropertyListManagementView>(
    `/saved-property-lists/manage/${managementToken}`,
  );
}

// GET /api/v1/saved-property-lists/shared/:shareToken
export function getSavedPropertyListByShareToken(
  shareToken: string,
): Promise<SavedPropertyListPublicView> {
  return apiFetch<SavedPropertyListPublicView>(`/saved-property-lists/shared/${shareToken}`);
}

// POST /api/v1/saved-property-lists/manage/:managementToken/items
export function addPropertyToSavedList(
  managementToken: string,
  propertyId: string,
): Promise<SavedPropertyListManagementView> {
  return apiFetch<SavedPropertyListManagementView>(
    `/saved-property-lists/manage/${managementToken}/items`,
    { method: 'POST', json: { propertyId } },
  );
}

// DELETE /api/v1/saved-property-lists/manage/:managementToken/items/:propertyId
export function removePropertyFromSavedList(
  managementToken: string,
  propertyId: string,
): Promise<void> {
  return apiFetch<void>(
    `/saved-property-lists/manage/${managementToken}/items/${propertyId}`,
    { method: 'DELETE' },
  );
}
