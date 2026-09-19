import { apiFetch } from './client';

/**
 * Espejo del contrato de apps/api/src/price-trends (ver
 * price-trend.util.ts / price-trend-result.interface.ts en ese modulo).
 */
export interface MonthlyPricePoint {
  month: string; // 'YYYY-MM'
  averagePricePerM2: number;
}

export type PriceTrendResult =
  | { available: true; series: MonthlyPricePoint[] }
  | { available: false; reason: 'no-zone' | 'insufficient-data' };

// GET /api/v1/properties/:id/price-trend
export function getPriceTrend(propertyId: string): Promise<PriceTrendResult> {
  return apiFetch<PriceTrendResult>(`/properties/${propertyId}/price-trend`);
}
