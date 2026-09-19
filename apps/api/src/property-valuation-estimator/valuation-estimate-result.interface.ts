import { PropertyType } from '../properties/entities/property-type.enum';

/**
 * specs/property-valuation-estimator/spec.md:
 * - Escenario "Comparables suficientes para venta/alquiler": rango de precio
 *   estimado (minimo/maximo orientativos) + numero de comparables usados.
 * - Escenario "Comparables insuficientes": `available: false`, sin rango.
 */
export type ValuationRangeResult =
  | { available: true; minPrice: number; maxPrice: number; comparablesCount: number }
  | { available: false; reason: 'insufficient-data' };

/**
 * Escenario "Los resultados son orientativos, no una tasacion oficial": la
 * respuesta siempre incluye `disclaimer`, tanto si hay rango disponible como
 * si no.
 */
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
