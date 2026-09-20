import { apiFetch } from './client';
import type { LeadIntent, LeadOrigin, LeadStatus, PropertyLead } from './types';

export interface CreateLeadInput {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  propertyId?: string;
  origin?: LeadOrigin;
  intent?: LeadIntent;
  visitAt?: string;
}

export interface CreateLeadResult {
  id: string;
}

export function createLead(propertyId: string, input: CreateLeadInput): Promise<CreateLeadResult> {
  return apiFetch<CreateLeadResult>(`/properties/${propertyId}/leads`, {
    method: 'POST',
    json: input,
  });
}

export function createPublicLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  return apiFetch<CreateLeadResult>('/leads', {
    method: 'POST',
    json: input,
  });
}

export function listAdminLeads(): Promise<PropertyLead[]> {
  return apiFetch<PropertyLead[]>('/admin/leads');
}

export function updateLeadStatus(id: string, status: LeadStatus): Promise<PropertyLead> {
  return apiFetch<PropertyLead>(`/admin/leads/${id}`, {
    method: 'PATCH',
    json: { status },
  });
}

export function trackWhatsAppLead(input: { propertyId?: string; message: string }): void {
  void createPublicLead({
    name: 'WhatsApp',
    message: input.message,
    propertyId: input.propertyId,
    origin: 'whatsapp',
  }).catch(() => undefined);
}
