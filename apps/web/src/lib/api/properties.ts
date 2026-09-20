import { apiFetch } from './client';
import type {
  CreatePropertyInput,
  ListingStatus,
  Property,
  PropertyFilters,
  UpdatePropertyInput,
} from './types';

/** Espejo de PropertyPriceHistory (apps/api/src/properties/entities/property-price-history.entity.ts). */
export interface PropertyPriceHistoryEntry {
  id: string;
  propertyId: string;
  price: string;
  recordedAt: string;
}

function buildQueryString(filters: PropertyFilters): string {
  const params = new URLSearchParams();

  if (filters.type) params.set('type', filters.type);
  if (filters.operationType) params.set('operationType', filters.operationType);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.minBedrooms !== undefined) params.set('minBedrooms', String(filters.minBedrooms));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.state) params.set('state', filters.state);
  if (filters.municipality) params.set('municipality', filters.municipality);
  if (filters.urbanization) params.set('urbanization', filters.urbanization);
  if (filters.hasElevator !== undefined) params.set('hasElevator', String(filters.hasElevator));
  if (filters.groundFloor !== undefined) params.set('groundFloor', String(filters.groundFloor));
  if (filters.needsRenovation !== undefined)
    params.set('needsRenovation', String(filters.needsRenovation));
  if (filters.listingStatus) params.set('listingStatus', filters.listingStatus);
  if (filters.area !== undefined) params.set('area', JSON.stringify(filters.area));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// GET /api/v1/properties
export function listProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  return apiFetch<Property[]>(`/properties${buildQueryString(filters)}`);
}

// GET /api/v1/admin/properties — incluye borradores y pausadas
export function listAdminProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  return apiFetch<Property[]>(`/admin/properties${buildQueryString(filters)}`);
}

// GET /api/v1/properties/:id
export function getProperty(id: string): Promise<Property> {
  return apiFetch<Property>(`/properties/${id}`);
}

// POST /api/v1/properties
export function createProperty(input: CreatePropertyInput): Promise<Property> {
  return apiFetch<Property>('/properties', { method: 'POST', json: input });
}

// PATCH /api/v1/properties/:id
export function updateProperty(id: string, input: UpdatePropertyInput): Promise<Property> {
  return apiFetch<Property>(`/properties/${id}`, { method: 'PATCH', json: input });
}

// PATCH /api/v1/properties/:id/status
export function updatePropertyStatus(id: string, listingStatus: ListingStatus): Promise<Property> {
  return apiFetch<Property>(`/properties/${id}/status`, {
    method: 'PATCH',
    json: { listingStatus },
  });
}

// DELETE /api/v1/properties/:id
export function deleteProperty(id: string): Promise<void> {
  return apiFetch<void>(`/properties/${id}`, { method: 'DELETE' });
}

// GET /api/v1/properties/:id/price-history
export function getPropertyPriceHistory(id: string): Promise<PropertyPriceHistoryEntry[]> {
  return apiFetch<PropertyPriceHistoryEntry[]>(`/properties/${id}/price-history`);
}
