'use client';

import { useState } from 'react';
import { OperationType, PropertyType, type PropertyFilters } from '../lib/api/types';
import { propertyTypeLabel } from '../lib/format';

interface PropertyFiltersBarProps {
  filters: PropertyFilters;
  onChange: (filters: PropertyFilters) => void;
}

type TriStateField = 'hasElevator' | 'groundFloor' | 'needsRenovation';

/**
 * Selector tri-estado (advanced-search-filters, tasks.md 4.1): "sin
 * especificar" (no se aplica el filtro) es un estado propio, distinto de
 * "no" (filtra por `false` explícito) - design.md, Risks/Trade-offs.
 */
function TriStateFilterSelect({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
}) {
  const stringValue = value === undefined ? '' : String(value);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={stringValue}
        onChange={(event) => {
          const raw = event.target.value;
          onChange(raw === '' ? undefined : raw === 'true');
        }}
      >
        <option value="">Sin especificar</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    </div>
  );
}

/**
 * Barra de filtros del listado (tasks.md 7.1, 4.1): tipo de vivienda,
 * operación, rango de precio (property-catalog spec, Requirement "Listar y
 * filtrar propiedades") y los filtros nuevos de ascensor, planta baja,
 * necesidad de reforma y procedencia bancaria (mismo requirement, tras
 * advanced-search-filters). Cada cambio se aplica de inmediato sobre
 * `filters`.
 */
export function PropertyFiltersBar({ filters, onChange }: PropertyFiltersBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function setTriState(field: TriStateField, value: boolean | undefined) {
    onChange({ ...filters, [field]: value });
  }

  return (
    <div className="filters-bar">
      <div className="op-pills" role="group" aria-label="Tipo de operación">
        <button
          type="button"
          className={!filters.operationType ? 'is-on' : ''}
          onClick={() => onChange({ ...filters, operationType: undefined })}
        >
          Todas
        </button>
        <button
          type="button"
          className={filters.operationType === OperationType.SALE ? 'is-on' : ''}
          onClick={() => onChange({ ...filters, operationType: OperationType.SALE })}
        >
          Comprar
        </button>
        <button
          type="button"
          className={filters.operationType === OperationType.RENT ? 'is-on' : ''}
          onClick={() => onChange({ ...filters, operationType: OperationType.RENT })}
        >
          Alquilar
        </button>
      </div>

      <div className="field">
        <label htmlFor="filter-type">Tipo de vivienda</label>
        <select
          id="filter-type"
          value={filters.type ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              type: event.target.value ? (event.target.value as PropertyType) : undefined,
            })
          }
        >
          <option value="">Todos</option>
          {Object.values(PropertyType).map((type) => (
            <option key={type} value={type}>
              {propertyTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-min-price">Precio mínimo</label>
        <input
          id="filter-min-price"
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.minPrice ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              minPrice: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
      </div>

      <div className="field">
        <label htmlFor="filter-max-price">Precio máximo</label>
        <input
          id="filter-max-price"
          type="number"
          min={0}
          inputMode="numeric"
          value={filters.maxPrice ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              maxPrice: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        />
      </div>

      <div className="field">
        <label htmlFor="filter-min-bedrooms">Habitaciones</label>
        <select
          id="filter-min-bedrooms"
          value={filters.minBedrooms ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              minBedrooms: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        >
          <option value="">Cualquiera</option>
          <option value="1">1 o más</option>
          <option value="2">2 o más</option>
          <option value="3">3 o más</option>
          <option value="4">4 o más</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="filter-municipality">Municipio</label>
        <input
          id="filter-municipality"
          type="text"
          placeholder="San Cristóbal"
          value={filters.municipality ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              municipality: event.target.value.trim() === '' ? undefined : event.target.value,
            })
          }
        />
      </div>

      <div className="filters-bar-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowAdvanced((open) => !open)}
        >
          {showAdvanced ? 'Menos filtros' : 'Más filtros'}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onChange({ area: filters.area })}
        >
          Limpiar
        </button>
      </div>

      {showAdvanced && (
        <div className="filters-advanced">
          <TriStateFilterSelect
            id="filter-has-elevator"
            label="Ascensor"
            value={filters.hasElevator}
            onChange={(value) => setTriState('hasElevator', value)}
          />

          <div className="field">
            <label htmlFor="filter-state">Estado</label>
            <input
              id="filter-state"
              type="text"
              placeholder="Táchira"
              value={filters.state ?? ''}
              onChange={(event) =>
                onChange({
                  ...filters,
                  state: event.target.value.trim() === '' ? undefined : event.target.value,
                })
              }
            />
          </div>

          <TriStateFilterSelect
            id="filter-ground-floor"
            label="Planta baja / PB"
            value={filters.groundFloor}
            onChange={(value) => setTriState('groundFloor', value)}
          />

          <TriStateFilterSelect
            id="filter-needs-renovation"
            label="Necesita reforma"
            value={filters.needsRenovation}
            onChange={(value) => setTriState('needsRenovation', value)}
          />
        </div>
      )}
    </div>
  );
}
