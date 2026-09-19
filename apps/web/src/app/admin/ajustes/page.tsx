'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AdminGuard } from '../../../components/AdminGuard';
import {
  getBrokerSettings,
  updateBrokerSettings,
  uploadBrokerLogo,
  uploadBrokerPhoto,
  type UpdateBrokerSettingsInput,
} from '../../../lib/api/brokerSettings';
import type { BrokerSettings } from '../../../lib/api/types';
import { ApiError } from '../../../lib/api/client';
import { resolveMediaUrl } from '../../../lib/config';

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <BrokerSettingsForm />
    </AdminGuard>
  );
}

function BrokerSettingsForm() {
  const [settings, setSettings] = useState<BrokerSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBrokerSettings()
      .then((data) => {
        if (!cancelled) setSettings(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los ajustes.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof BrokerSettings>(field: K, value: BrokerSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const payload: UpdateBrokerSettingsInput = {
      businessName: settings.businessName,
      slogan: settings.slogan || null,
      advisorName: settings.advisorName || null,
      advisorTitle: settings.advisorTitle || null,
      whatsapp: settings.whatsapp || null,
      phone: settings.phone || null,
      email: settings.email || null,
      instagram: settings.instagram || null,
      facebook: settings.facebook || null,
      tiktok: settings.tiktok || null,
      officeAddress: settings.officeAddress || null,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      mapCenterLat: Number(settings.mapCenterLat),
      mapCenterLng: Number(settings.mapCenterLng),
      mapZoom: Number(settings.mapZoom),
      coverageText: settings.coverageText || null,
      businessHours: settings.businessHours || null,
      footerLegal: settings.footerLegal || null,
      aboutText: settings.aboutText || null,
    };

    try {
      const saved = await updateBrokerSettings(payload);
      setSettings(saved);
      setSuccess('Ajustes guardados.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron guardar los ajustes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssetUpload(kind: 'logo' | 'photo', file: File | undefined) {
    if (!file) return;
    setError(null);
    setSuccess(null);
    try {
      const saved = kind === 'logo' ? await uploadBrokerLogo(file) : await uploadBrokerPhoto(file);
      setSettings(saved);
      setSuccess(kind === 'logo' ? 'Logo actualizado.' : 'Foto actualizada.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el archivo.');
    }
  }

  if (isLoading) {
    return (
      <main className="page">
        <p className="spinner-text">Cargando ajustes…</p>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="page">
        <div className="alert alert-error">{error ?? 'No se pudieron cargar los ajustes.'}</div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>Ajustes del sitio</h1>
      </div>
      <div className="section">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-info">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="businessName">Nombre comercial</label>
              <input
                id="businessName"
                type="text"
                value={settings.businessName}
                onChange={(event) => setField('businessName', event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="slogan">Slogan</label>
              <input
                id="slogan"
                type="text"
                value={settings.slogan ?? ''}
                onChange={(event) => setField('slogan', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="advisorName">Nombre del asesor</label>
              <input
                id="advisorName"
                type="text"
                value={settings.advisorName ?? ''}
                onChange={(event) => setField('advisorName', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="advisorTitle">Cargo</label>
              <input
                id="advisorTitle"
                type="text"
                value={settings.advisorTitle ?? ''}
                onChange={(event) => setField('advisorTitle', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                id="whatsapp"
                type="text"
                placeholder="58412..."
                value={settings.whatsapp ?? ''}
                onChange={(event) => setField('whatsapp', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Teléfono</label>
              <input
                id="phone"
                type="text"
                value={settings.phone ?? ''}
                onChange={(event) => setField('phone', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={settings.email ?? ''}
                onChange={(event) => setField('email', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="officeAddress">Dirección de oficina</label>
              <input
                id="officeAddress"
                type="text"
                value={settings.officeAddress ?? ''}
                onChange={(event) => setField('officeAddress', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="instagram">Instagram</label>
              <input
                id="instagram"
                type="text"
                value={settings.instagram ?? ''}
                onChange={(event) => setField('instagram', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="facebook">Facebook</label>
              <input
                id="facebook"
                type="text"
                value={settings.facebook ?? ''}
                onChange={(event) => setField('facebook', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="tiktok">TikTok</label>
              <input
                id="tiktok"
                type="text"
                value={settings.tiktok ?? ''}
                onChange={(event) => setField('tiktok', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="primaryColor">Color principal</label>
              <input
                id="primaryColor"
                type="text"
                value={settings.primaryColor}
                onChange={(event) => setField('primaryColor', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="secondaryColor">Color secundario</label>
              <input
                id="secondaryColor"
                type="text"
                value={settings.secondaryColor}
                onChange={(event) => setField('secondaryColor', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mapCenterLat">Centro del mapa (lat)</label>
              <input
                id="mapCenterLat"
                type="number"
                step="any"
                value={settings.mapCenterLat}
                onChange={(event) => setField('mapCenterLat', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mapCenterLng">Centro del mapa (lng)</label>
              <input
                id="mapCenterLng"
                type="number"
                step="any"
                value={settings.mapCenterLng}
                onChange={(event) => setField('mapCenterLng', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="mapZoom">Zoom del mapa</label>
              <input
                id="mapZoom"
                type="number"
                min={1}
                max={20}
                value={settings.mapZoom}
                onChange={(event) => setField('mapZoom', Number(event.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="coverageText">Zona de cobertura</label>
              <input
                id="coverageText"
                type="text"
                value={settings.coverageText ?? ''}
                onChange={(event) => setField('coverageText', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="businessHours">Horario</label>
              <input
                id="businessHours"
                type="text"
                value={settings.businessHours ?? ''}
                onChange={(event) => setField('businessHours', event.target.value)}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="footerLegal">Texto legal del pie</label>
              <input
                id="footerLegal"
                type="text"
                value={settings.footerLegal ?? ''}
                onChange={(event) => setField('footerLegal', event.target.value)}
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="aboutText">Texto de Nosotros</label>
              <textarea
                id="aboutText"
                rows={6}
                value={settings.aboutText ?? ''}
                onChange={(event) => setField('aboutText', event.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn" disabled={isSaving}>
              {isSaving ? 'Guardando…' : 'Guardar ajustes'}
            </button>
          </div>
        </form>
      </div>

      <div className="section">
        <h2>Logo y foto</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="logo-file">Logo</label>
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(settings.logoUrl)} alt="Logo" className="settings-preview" />
            )}
            <input
              id="logo-file"
              type="file"
              accept="image/*"
              onChange={(event) => handleAssetUpload('logo', event.target.files?.[0])}
            />
          </div>
          <div className="field">
            <label htmlFor="photo-file">Foto del asesor</label>
            {settings.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveMediaUrl(settings.photoUrl)} alt="Foto" className="settings-preview" />
            )}
            <input
              id="photo-file"
              type="file"
              accept="image/*"
              onChange={(event) => handleAssetUpload('photo', event.target.files?.[0])}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
