import { apiFetch } from './client';
import type { PropertyLead } from './types';

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}

export interface CreateLeadResult {
  id: string;
}

// POST /api/v1/properties/:id/leads (público)
export function createLead(propertyId: string, input: CreateLeadInput): Promise<CreateLeadResult> {
  return apiFetch<CreateLeadResult>(`/properties/${propertyId}/leads`, {
    method: 'POST',
    json: input,
  });
}

// GET /api/v1/admin/leads
export function listAdminLeads(): Promise<PropertyLead[]> {
  return apiFetch<PropertyLead[]>('/admin/leads');
}
