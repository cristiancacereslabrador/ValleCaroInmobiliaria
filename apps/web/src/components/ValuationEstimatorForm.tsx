'use client';

import { useState, type FormEvent } from 'react';
import { PropertyType, type LeadIntent } from '../lib/api/types';
import { propertyTypeLabel } from '../lib/format';
import { ApiError } from '../lib/api/client';
import { createPublicLead } from '../lib/api/leads';

interface FormState {
  name: string;
  email: string;
  phone: string;
  type: PropertyType | '';
  intent: LeadIntent;
  city: string;
  postalCode: string;
  surfaceM2: string;
  bedrooms: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  type: '',
  intent: 'sell',
  city: '',
  postalCode: '',
  surfaceM2: '',
  bedrooms: '',
  status: '',
};

function buildLeadMessage(form: FormState): string {
  const parts = [
    `Solicitud de tasación (${form.intent === 'rent' ? 'alquiler' : 'venta'}).`,
    form.type ? `Tipo: ${propertyTypeLabel(form.type)}.` : null,
    form.city.trim() ? `Ciudad: ${form.city.trim()}.` : null,
    form.postalCode.trim() ? `Código postal: ${form.postalCode.trim()}.` : null,
    form.surfaceM2.trim() ? `Superficie: ${form.surfaceM2.trim()} m².` : null,
    form.bedrooms.trim() ? `Habitaciones: ${form.bedrooms.trim()}.` : null,
    form.status.trim() ? `Estado: ${form.status.trim()}.` : null,
    'El interesado no recibió precio en la web: espera visita, análisis e informe.',
  ];
  return parts.filter(Boolean).join(' ');
}

/**
 * Solicitud pública de tasación: el visitante deja tipo, contacto y datos
 * del inmueble. No se muestra ni se calcula un precio de venta en la página.
 * El monto lo sugiere el asesor después de conocer la propiedad; el dueño
 * decide el precio de publicación.
 */
export function ValuationEstimatorForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.name.trim().length < 2) {
      setError('Indica tu nombre para que un asesor te contacte.');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setError('Deja un correo o un teléfono para coordinar la visita.');
      return;
    }
    if (!form.type) {
      setError('El tipo de vivienda es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPublicLead({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        origin: 'valuation',
        intent: form.intent,
        message: buildLeadMessage(form),
      });
      setSuccess(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-info">
          Recibimos tus datos. Un asesor conocerá la propiedad, la analizará y te entregará un
          informe con una sugerencia de valor. El precio de publicación lo decides tú.
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="valuation-name">Nombre *</label>
          <input
            id="valuation-name"
            type="text"
            value={form.name}
            onChange={(event) => setField('name', event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="valuation-email">Email</label>
          <input
            id="valuation-email"
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="valuation-phone">Teléfono / WhatsApp</label>
          <input
            id="valuation-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setField('phone', event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="valuation-type">Tipo de vivienda *</label>
          <select
            id="valuation-type"
            value={form.type}
            onChange={(event) => setField('type', event.target.value as PropertyType)}
            required
          >
            <option value="">Selecciona un tipo</option>
            {Object.values(PropertyType).map((type) => (
              <option key={type} value={type}>
                {propertyTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="valuation-intent">Quiero</label>
          <select
            id="valuation-intent"
            value={form.intent}
            onChange={(event) => setField('intent', event.target.value as LeadIntent)}
          >
            <option value="sell">Vender</option>
            <option value="rent">Alquilar (como propietario)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="valuation-city">Ciudad</label>
          <input
            id="valuation-city"
            type="text"
            placeholder="San Cristóbal"
            value={form.city}
            onChange={(event) => setField('city', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="valuation-postal-code">Código postal</label>
          <input
            id="valuation-postal-code"
            type="text"
            placeholder="p. ej. 5001"
            value={form.postalCode}
            onChange={(event) => setField('postalCode', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="valuation-surface">Superficie (m²)</label>
          <input
            id="valuation-surface"
            type="number"
            min={0}
            step="0.01"
            value={form.surfaceM2}
            onChange={(event) => setField('surfaceM2', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="valuation-bedrooms">Habitaciones</label>
          <input
            id="valuation-bedrooms"
            type="number"
            min={0}
            value={form.bedrooms}
            onChange={(event) => setField('bedrooms', event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="valuation-status">Estado</label>
          <input
            id="valuation-status"
            type="text"
            placeholder="p. ej. buen estado, a reformar…"
            value={form.status}
            onChange={(event) => setField('status', event.target.value)}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Solicitar tasación'}
        </button>
      </div>
    </form>
  );
}
