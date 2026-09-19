'use client';

import { useState, type FormEvent } from 'react';
import { PropertyType } from '../lib/api/types';
import { propertyTypeLabel, formatPrice } from '../lib/format';
import { ApiError } from '../lib/api/client';
import {
  estimatePropertyValuation,
  type PropertyValuationEstimateResult,
  type ValuationRangeResult,
} from '../lib/api/propertyValuationEstimator';

interface FormState {
  type: PropertyType | '';
  city: string;
  postalCode: string;
  surfaceM2: string;
  bedrooms: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  type: '',
  city: '',
  postalCode: '',
  surfaceM2: '',
  bedrooms: '',
  status: '',
};

function toNumberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? undefined : numeric;
}

/**
 * specs/property-valuation-estimator/spec.md - Requirement "Formulario de
 * tasacion independiente del catalogo publicado" (tasks.md 3.1/3.2):
 * formulario propio, no reutiliza `PropertyForm` (ese crea/edita una
 * propiedad real del catalogo, este no persiste nada). Campos obligatorios:
 * tipo, zona (ciudad o codigo postal - basta uno) y superficie; habitaciones
 * y estado son opcionales (design.md - Decision 1 no los usa como filtro
 * salvo habitaciones, que si se usa +/-1 cuando se indica).
 */
export function ValuationEstimatorForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [result, setResult] = useState<PropertyValuationEstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.type) {
      setError('El tipo de vivienda es obligatorio.');
      return;
    }
    if (form.city.trim() === '' && form.postalCode.trim() === '') {
      setError('Indica la ciudad o el código postal.');
      return;
    }
    if (form.surfaceM2.trim() === '') {
      setError('La superficie es obligatoria.');
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      const estimate = await estimatePropertyValuation({
        type: form.type,
        city: form.city.trim() === '' ? undefined : form.city.trim(),
        postalCode: form.postalCode.trim() === '' ? undefined : form.postalCode.trim(),
        surfaceM2: Number(form.surfaceM2),
        bedrooms: toNumberOrUndefined(form.bedrooms),
        status: form.status.trim() === '' ? undefined : form.status.trim(),
      });
      setResult(estimate);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo calcular la estimación.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-grid">
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
            <label htmlFor="valuation-surface">Superficie (m²) *</label>
            <input
              id="valuation-surface"
              type="number"
              min={0}
              step="0.01"
              value={form.surfaceM2}
              onChange={(event) => setField('surfaceM2', event.target.value)}
              required
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
            {isSubmitting ? 'Calculando…' : 'Estimar valor'}
          </button>
        </div>
      </form>

      {result && <ValuationResult result={result} />}
    </div>
  );
}

function ValuationResult({ result }: { result: PropertyValuationEstimateResult }) {
  return (
    <div className="section valuation-result">
      <h2>Resultado de la tasación</h2>

      <ValuationRangeCard title="Precio de venta estimado" range={result.sale} />
      <ValuationRangeCard title="Precio de alquiler estimado" range={result.rent} />

      <p className="alert alert-info">{result.disclaimer}</p>
    </div>
  );
}

function ValuationRangeCard({ title, range }: { title: string; range: ValuationRangeResult }) {
  return (
    <div className="valuation-range-card">
      <h3>{title}</h3>
      {range.available ? (
        <>
          <p className="valuation-range-value">
            {formatPrice(range.minPrice)} – {formatPrice(range.maxPrice)}
          </p>
          <p className="valuation-range-meta">
            Basado en {range.comparablesCount} propiedades comparables del catálogo.
          </p>
        </>
      ) : (
        <p className="alert alert-info">
          No hay datos suficientes en el catálogo para estimar este rango en esta zona/tipo.
        </p>
      )}
    </div>
  );
}
