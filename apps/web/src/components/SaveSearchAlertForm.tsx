'use client';

import { useState } from 'react';
import { createSavedSearchAlert } from '../lib/api/savedSearchAlerts';
import { ApiError } from '../lib/api/client';
import type { PropertyFilters } from '../lib/api/types';

interface SaveSearchAlertFormProps {
  filters: PropertyFilters;
}

/**
 * tasks.md 6.1: formulario para guardar la busqueda actual (los filtros ya
 * aplicados en `PropertyFiltersBar`) junto con un email, desde la propia
 * pagina de listado (spec.md, Requirement "Guardar una busqueda con alerta
 * por email"). Sin cuenta ni login: solo pide el email y reutiliza
 * `filters` tal cual, ya que su shape coincide 1:1 con `QueryPropertiesDto`
 * (ver apps/api/.../saved-search-alerts/dto/create-saved-search-alert.dto.ts).
 */
export function SaveSearchAlertForm({ filters }: SaveSearchAlertFormProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createSavedSearchAlert(email, filters);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'No se pudo guardar la alerta. Inténtalo de nuevo.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="section save-search-alert">
        <div className="alert alert-info">
          Revisa tu email para confirmar la alerta. No empezará a avisarte hasta que confirmes
          desde el enlace que te hemos enviado.
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setSuccess(false)}>
          Guardar otra alerta
        </button>
      </div>
    );
  }

  return (
    <div className="section save-search-alert">
      <h2>Avísame de nuevas propiedades como esta</h2>
      <p className="spinner-text">
        Guarda esta búsqueda con los filtros que tienes aplicados ahora mismo. Te avisaremos por
        email cuando aparezca una propiedad nueva que coincida, o si cambia de precio.
      </p>
      <form className="save-search-alert-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="alert-email">Email</label>
          <input
            id="alert-email"
            type="email"
            required
            placeholder="tu@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="filters-bar-actions">
          <span className="filters-actions-label" aria-hidden="true">
            Acciones
          </span>
          <div className="filters-bar-actions-row">
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Crear alerta'}
            </button>
          </div>
        </div>
      </form>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
