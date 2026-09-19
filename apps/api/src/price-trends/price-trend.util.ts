export interface PriceHistoryPoint {
  propertyId: string;
  price: number;
  surfaceM2: number;
  recordedAt: Date;
}

export interface MonthlyPricePoint {
  month: string; // 'YYYY-MM'
  averagePricePerM2: number;
}

/**
 * price-trends spec, Requirement "Calculo de evolucion de precio medio por
 * m2 en una zona" (design.md - Decision 3): precio/m2 de cada punto
 * historico = precio / superficie, agregados en buckets mensuales
 * (promedio). Funcion pura, sin dependencias externas, para poder testear el
 * calculo de la serie de forma aislada (tasks.md 4.1).
 *
 * Puntos con superficie 0 o negativa (division invalida) se descartan
 * silenciosamente en vez de producir Infinity/NaN en la serie; el llamador
 * (PriceTrendsService) ya filtra los puntos sin superficie antes de llegar
 * aqui, pero la funcion se mantiene defensiva por si se usa con otros datos.
 */
export function computeMonthlyPriceTrend(points: PriceHistoryPoint[]): MonthlyPricePoint[] {
  const pricesPerM2ByMonth = new Map<string, number[]>();

  for (const point of points) {
    if (!(point.surfaceM2 > 0)) {
      continue;
    }

    const month = formatMonth(point.recordedAt);
    const pricePerM2 = point.price / point.surfaceM2;

    const bucket = pricesPerM2ByMonth.get(month) ?? [];
    bucket.push(pricePerM2);
    pricesPerM2ByMonth.set(month, bucket);
  }

  return Array.from(pricesPerM2ByMonth.entries())
    .map(([month, pricesPerM2]) => ({
      month,
      averagePricePerM2: average(pricesPerM2),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

function formatMonth(date: Date): string {
  const parsed = new Date(date);
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}`;
}

function average(values: number[]): number {
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
