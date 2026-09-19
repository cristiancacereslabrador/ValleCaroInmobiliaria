import { apiFetch, apiUpload } from './client';
import type { BrokerSettings } from './types';

export type UpdateBrokerSettingsInput = {
  businessName?: string;
  slogan?: string | null;
  advisorName?: string | null;
  advisorTitle?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  officeAddress?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  mapCenterLat?: number;
  mapCenterLng?: number;
  mapZoom?: number;
  coverageText?: string | null;
  businessHours?: string | null;
  footerLegal?: string | null;
  aboutText?: string | null;
};

// GET /api/v1/broker-settings (público)
export function getBrokerSettings(): Promise<BrokerSettings> {
  return apiFetch<BrokerSettings>('/broker-settings');
}

// PATCH /api/v1/admin/broker-settings
export function updateBrokerSettings(input: UpdateBrokerSettingsInput): Promise<BrokerSettings> {
  return apiFetch<BrokerSettings>('/admin/broker-settings', {
    method: 'PATCH',
    json: input,
  });
}

// POST /api/v1/admin/broker-settings/logo (multipart field "file")
export function uploadBrokerLogo(file: File): Promise<BrokerSettings> {
  const form = new FormData();
  form.append('file', file);
  return apiUpload<BrokerSettings>('/admin/broker-settings/logo', form);
}

// POST /api/v1/admin/broker-settings/photo (multipart field "file")
export function uploadBrokerPhoto(file: File): Promise<BrokerSettings> {
  const form = new FormData();
  form.append('file', file);
  return apiUpload<BrokerSettings>('/admin/broker-settings/photo', form);
}
