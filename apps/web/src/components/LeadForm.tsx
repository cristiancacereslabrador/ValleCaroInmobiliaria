'use client';

import { useState, type FormEvent } from 'react';
import { createLead, createPublicLead } from '../lib/api/leads';
import { ApiError } from '../lib/api/client';

function toIsoOrUndefined(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function LeadForm({ propertyId }: { propertyId?: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [visitAt, setVisitAt] = useState('');
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
      setError('El mensaje debe tener al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const visitIso = toIsoOrUndefined(visitAt);
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim(),
        origin: 'web' as const,
        intent: visitIso ? ('visit' as const) : undefined,
        visitAt: visitIso,
      };
      if (propertyId) {
        await createLead(propertyId, payload);
      } else {
        await createPublicLead(payload);
      }
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setVisitAt('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el mensaje.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      {success && (
        <div className="alert alert-info">Mensaje enviado. Te contactaremos pronto.</div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="lead-name">Nombre *</label>
          <input
            id="lead-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="lead-email">Email</label>
          <input
            id="lead-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="lead-phone">Teléfono</label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="lead-visit">Agendar visita</label>
          <input
            id="lead-visit"
            type="datetime-local"
            value={visitAt}
            onChange={(event) => setVisitAt(event.target.value)}
          />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="lead-message">Mensaje *</label>
          <textarea
            id="lead-message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Enviar mensaje'}
        </button>
      </div>
    </form>
  );
}
