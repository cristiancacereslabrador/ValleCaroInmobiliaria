'use client';

import { useState, type FormEvent } from 'react';
import { createLead } from '../lib/api/leads';
import { ApiError } from '../lib/api/client';

export function LeadForm({ propertyId }: { propertyId: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
      await createLead(propertyId, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim(),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
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
