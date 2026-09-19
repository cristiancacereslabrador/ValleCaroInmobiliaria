import { apiFetch } from './client';
import { PropertyType } from './types';

/**
 * Espejo del contrato de apps/api/src/property-valuation-estimator (ver
 * dto/estimate-valuation.dto.ts y valuation-estimate-result.interface.ts en
 * ese modulo). Reutiliza `PropertyType` de property-catalog porque el
 * modulo backend tambien reutiliza ese enum.
 */
export interface EstimateValuationInput {
  type: PropertyType;
  /** Basta con indicar ciudad O codigo postal (al menos uno de los dos). */
  city?: string;
  postalCode?: string;
  surfaceM2: number;
  bedrooms?: number;
  status?: string;
}

export type ValuationRangeResult =
  | { available: true; minPrice: number; maxPrice: number; comparablesCount: number }
  | { available: false; reason: 'insufficient-data' };

export interface PropertyValuationEstimateResult {
  criteria: {
    type: PropertyType;
    city: string | null;
    postalCode: string | null;
    surfaceM2: number;
    bedrooms: number | null;
    status: string | null;
  };
  sale: ValuationRangeResult;
  rent: ValuationRangeResult;
  disclaimer: string;
}

// POST /api/v1/property-valuation-estimator/estimate
export function estimatePropertyValuation(
  input: EstimateValuationInput,
): Promise<PropertyValuationEstimateResult> {
  return apiFetch<PropertyValuationEstimateResult>('/property-valuation-estimator/estimate', {
    method: 'POST',
    json: input,
  });
}
