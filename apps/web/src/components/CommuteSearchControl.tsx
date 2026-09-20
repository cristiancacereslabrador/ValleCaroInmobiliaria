'use client';

import { useState, type FormEvent } from 'react';
import { TransportMode } from '../lib/api/commuteSearch';

export interface CommuteSearchValue {
  destinationAddress: string;
  transportMode: TransportMode;
  maxDurationMinutes: number;
}

const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  [TransportMode.DRIVING]: 'Carro',
  [TransportMode.TRANSIT]: 'Transporte público',
  [TransportMode.WALKING]: 'A pie',
};

interface CommuteSearchControlProps {
  /** Búsqueda por trayecto activa actualmente (null = sin aplicar). */
  active: CommuteSearchValue | null;
  onSearch: (value: CommuteSearchValue) => void;
  onClear: () => void;
  isLoading: boolean;
  /** Requirement "Manejo de error del servicio de cálculo de trayectos". */
  error: string | null;
}

/**
 * Control de búsqueda por tiempo de trayecto (tasks.md 3.1): dirección de
 * destino, medio de transporte y tiempo máximo (proposal.md - What
 * Changes). Mantiene su propio borrador de formulario; delega en el
 * llamador (CatalogPage) la llamada real a `GET /api/v1/commute-search` y
 * la combinación con el resto de filtros del catálogo, igual que
 * `PropertyFiltersBar`/`ListingMap` delegan la búsqueda por área.
 */
export function CommuteSearchControl({
  active,
  onSearch,
  onClear,
  isLoading,
  error,
}: CommuteSearchControlProps) {
  const [destinationAddress, setDestinationAddress] = useState(active?.destinationAddress ?? '');
  const [transportMode, setTransportMode] = useState<TransportMode>(
    active?.transportMode ?? TransportMode.DRIVING,
  );
  const [maxDurationMinutes, setMaxDurationMinutes] = useState<number | ''>(
    active?.maxDurationMinutes ?? 30,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!destinationAddress.trim()) {
      setValidationError('Indica una dirección de destino.');
      return;
    }

    if (maxDurationMinutes === '' || maxDurationMinutes <= 0) {
      setValidationError('Indica un tiempo máximo de trayecto válido (en minutos).');
      return;
    }

    setValidationError(null);
    onSearch({
      destinationAddress: destinationAddress.trim(),
      transportMode,
      maxDurationMinutes,
    });
  }

  function handleClear() {
    setValidationError(null);
    onClear();
  }

  return (
    <div className="commute-search-bar">
      <form className="commute-search-form" onSubmit={handleSubmit}>
        <div className="field commute-search-destination">
          <label htmlFor="commute-destination">Cerca de…</label>
          <input
            id="commute-destination"
            type="text"
            placeholder="Dirección de destino (p. ej. tu trabajo)"
            value={destinationAddress}
            onChange={(event) => setDestinationAddress(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="commute-transport-mode">Medio de transporte</label>
          <select
            id="commute-transport-mode"
            value={transportMode}
            onChange={(event) => setTransportMode(event.target.value as TransportMode)}
          >
            {Object.values(TransportMode).map((mode) => (
              <option key={mode} value={mode}>
                {TRANSPORT_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="commute-max-duration">Tiempo máximo (min)</label>
          <input
            id="commute-max-duration"
            type="number"
            min={1}
            inputMode="numeric"
            value={maxDurationMinutes}
            onChange={(event) =>
              setMaxDurationMinutes(event.target.value === '' ? '' : Number(event.target.value))
            }
          />
        </div>

        <div className="filters-bar-actions">
          <span className="filters-actions-label" aria-hidden="true">
            Acciones
          </span>
          <div className="filters-bar-actions-row">
            <button type="submit" className="btn" disabled={isLoading}>
              {isLoading ? 'Buscando…' : 'Buscar por trayecto'}
            </button>
            {active && (
              <button type="button" className="btn btn-secondary" onClick={handleClear}>
                Quitar filtro de trayecto
              </button>
            )}
          </div>
        </div>
      </form>

      {validationError && <div className="alert alert-error">{validationError}</div>}
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
