'use client';

import { useEffect, useState } from 'react';
import { getPriceTrend } from '../lib/api/priceTrends';
import type { MonthlyPricePoint, PriceTrendResult } from '../lib/api/priceTrends';
import { formatPrice } from '../lib/format';

interface PriceTrendSectionProps {
  propertyId: string;
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const CHART_PADDING = { top: 16, right: 16, bottom: 28, left: 16 };

function monthLabel(month: string): string {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

/**
 * Grafico de linea minimo en SVG puro (sin libreria externa: el proyecto no
 * tiene ninguna instalada y no merece la pena añadir una dependencia para un
 * unico grafico de evolucion mensual). Escala ambos ejes linealmente entre
 * el minimo y el maximo de la serie.
 */
function PriceTrendChart({ series }: { series: MonthlyPricePoint[] }) {
  const values = series.map((point) => point.averagePricePerM2);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const points = series.map((point, index) => {
    const x =
      CHART_PADDING.left + (series.length === 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth);
    const y =
      CHART_PADDING.top + plotHeight - ((point.averagePricePerM2 - minValue) / valueRange) * plotHeight;
    return { x, y, point };
  });

  const linePath = points.map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      role="img"
      aria-label="Evolución del precio medio por metro cuadrado en la zona"
      style={{ width: '100%', height: 'auto' }}
    >
      <path d={linePath} fill="none" stroke="var(--color-accent, #2563eb)" strokeWidth={2} />
      {points.map(({ x, y, point }) => (
        <g key={point.month}>
          <circle cx={x} cy={y} r={3.5} fill="var(--color-accent, #2563eb)" />
          <text x={x} y={CHART_HEIGHT - 8} fontSize={10} textAnchor="middle" fill="var(--color-text-muted)">
            {monthLabel(point.month)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Seccion "Evolución de precio en la zona" de la ficha de propiedad
 * (price-trends spec, Requirement "Visualizacion de la evolucion de precio
 * en la ficha de propiedad" - tasks.md 7.1): grafico de la serie mensual de
 * precio medio por m² en la zona (ciudad + codigo postal) de la propiedad.
 *
 * Scenario "Ficha sin tendencia de zona disponible": tanto si la propiedad
 * no tiene ciudad/codigo postal como si la zona no alcanza el umbral minimo
 * de datos, la seccion se muestra igualmente indicando que no hay datos de
 * tendencia disponibles.
 */
export function PriceTrendSection({ propertyId }: PriceTrendSectionProps) {
  const [result, setResult] = useState<PriceTrendResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    getPriceTrend(propertyId)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled) setResult({ available: false, reason: 'insufficient-data' });
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <div className="section">
      <h2>Evolución de precio en la zona</h2>

      {isLoading && <p className="spinner-text">Cargando tendencia de precio…</p>}

      {!isLoading && result?.available && (
        <>
          <PriceTrendChart series={result.series} />
          <dl className="spec-grid">
            {result.series.map((point) => (
              <div className="spec-item" key={point.month}>
                <dt>{monthLabel(point.month)}</dt>
                <dd>{formatPrice(point.averagePricePerM2)}/m²</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {!isLoading && result && !result.available && (
        <p className="alert alert-info">
          {result.reason === 'no-zone'
            ? 'Esta propiedad no tiene ciudad y código postal registrados, así que no se puede calcular la tendencia de su zona.'
            : 'Todavía no hay datos suficientes para mostrar una tendencia fiable en esta zona.'}
        </p>
      )}
    </div>
  );
}
