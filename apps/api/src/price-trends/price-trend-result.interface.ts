import { MonthlyPricePoint } from './price-trend.util';

/**
 * price-trends spec:
 * - Requirement "Calculo de evolucion de precio medio por m2 en una zona",
 *   Scenario "Zona con datos insuficientes": `available: false, reason:
 *   'insufficient-data'`.
 * - Requirement "Visualizacion de la evolucion de precio en la ficha de
 *   propiedad", Scenario "Ficha sin tendencia de zona disponible": una
 *   propiedad sin ciudad/codigo postal registrados -> `available: false,
 *   reason: 'no-zone'`.
 */
export type PriceTrendResult =
  | { available: true; series: MonthlyPricePoint[] }
  | { available: false; reason: 'no-zone' | 'insufficient-data' };
