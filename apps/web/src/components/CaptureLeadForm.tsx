'use client';

import { useState, type FormEvent } from 'react';
import { createPublicLead } from '../lib/api/leads';
import { ApiError } from '../lib/api/client';
import type { LeadIntent } from '../lib/api/types';

export function CaptureLeadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [intent, setIntent] = useState<LeadIntent>('sell');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (name.trim().length < 2) {
      setError('Indica tu nombre.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Indica un email o un teléfono para poder contactarte.');
      return;
    }
    if (message.trim().length < 10) {
      setError('Cuéntanos un poco más de tu inmueble (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPublicLead({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim(),
        origin: 'sell_form',
        intent,
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el formulario.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-info">
          Recibimos tu solicitud. Un asesor te escribe para coordinar visita y publicación. El
          precio lo defines tú como propietario.
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="capture-name">Nombre *</label>
          <input
            id="capture-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="capture-email">Email</label>
          <input
            id="capture-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="capture-phone">Teléfono / WhatsApp</label>
          <input
            id="capture-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="capture-intent">Quiero</label>
          <select
            id="capture-intent"
            value={intent}
            onChange={(event) => setIntent(event.target.value as LeadIntent)}
          >
            <option value="sell">Vender</option>
            <option value="rent">Alquilar (como propietario)</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="capture-message">Cuéntanos del inmueble *</label>
          <textarea
            id="capture-message"
            rows={5}
            placeholder="Zona, tipo (quinta, apartamento, local), metros, si tiene planta o tanque de agua…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar a un asesor'}
        </button>
      </div>
    </form>
  );
}
