/**
 * design.md - Decision 1: rango de precio = percentiles 25-75 del precio/m2
 * de los comparables, aplicado a la superficie indicada. Funcion pura, sin
 * dependencias externas, para poder testear el calculo de forma aislada
 * (tasks.md 2.2), igual que `price-trends`/`price-trend.util.ts`.
 */

/**
 * Percentil por interpolacion lineal (metodo habitual, el mismo que usan
 * Excel/numpy por defecto - "linear interpolation between closest ranks").
 * `values` debe venir ya ordenado ascendentemente y no vacio.
 */
export function computePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) {
    throw new Error('computePercentile requiere al menos un valor');
  }
  if (sortedValues.length === 1) {
    return sortedValues[0];
  }

  const rank = (percentile / 100) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  const fraction = rank - lowerIndex;
  return (
    sortedValues[lowerIndex] + (sortedValues[upperIndex] - sortedValues[lowerIndex]) * fraction
  );
}

export interface ValuationPriceRange {
  minPrice: number;
  maxPrice: number;
}

/**
 * `pricesPerM2` = precio/m2 de cada comparable (uno por propiedad). Se
 * ordenan, se toman los percentiles 25 y 75, y se multiplican por la
 * superficie del inmueble a tasar. Redondeado a 2 decimales, igual que el
 * resto de calculadoras del proyecto.
 */
export function computeValuationPriceRange(
  pricesPerM2: number[],
  surfaceM2: number,
): ValuationPriceRange {
  if (pricesPerM2.length === 0) {
    throw new Error('computeValuationPriceRange requiere al menos un comparable');
  }

  const sorted = [...pricesPerM2].sort((a, b) => a - b);
  const p25 = computePercentile(sorted, 25);
  const p75 = computePercentile(sorted, 75);

  return {
    minPrice: round2(p25 * surfaceM2),
    maxPrice: round2(p75 * surfaceM2),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
