import { computePercentile, computeValuationPriceRange } from './valuation-price-range.util';

describe('computePercentile (2.2)', () => {
  it('calcula el percentil 25 y 75 de un conjunto conocido por interpolacion lineal', () => {
    const values = [1000, 2000, 3000, 4000, 5000];

    // rank(25) = 0.25 * 4 = 1 -> values[1] = 2000
    expect(computePercentile(values, 25)).toBe(2000);
    // rank(75) = 0.75 * 4 = 3 -> values[3] = 4000
    expect(computePercentile(values, 75)).toBe(4000);
  });

  it('interpola entre dos valores cuando el rango no cae en un indice entero', () => {
    const values = [1000, 2000, 3000, 4000];

    // rank(25) = 0.25 * 3 = 0.75 -> interpola entre values[0] y values[1]
    expect(computePercentile(values, 25)).toBeCloseTo(1750, 5);
    // rank(75) = 0.75 * 3 = 2.25 -> interpola entre values[2] y values[3]
    expect(computePercentile(values, 75)).toBeCloseTo(3250, 5);
  });

  it('devuelve el unico valor cuando solo hay un comparable', () => {
    expect(computePercentile([2500], 25)).toBe(2500);
    expect(computePercentile([2500], 75)).toBe(2500);
  });

  it('lanza un error si se llama sin valores', () => {
    expect(() => computePercentile([], 25)).toThrow();
  });
});

describe('computeValuationPriceRange (2.2)', () => {
  it('aplica los percentiles 25-75 de precio/m2 a la superficie indicada', () => {
    // precio/m2: 2000, 2200, 2400, 2600, 2800 (ya ordenados)
    const pricesPerM2 = [2000, 2200, 2400, 2600, 2800];

    const result = computeValuationPriceRange(pricesPerM2, 100);

    // p25 -> 2200, p75 -> 2600 (rank 1 y 3 sobre 5 valores)
    expect(result).toEqual({ minPrice: 220000, maxPrice: 260000 });
  });

  it('funciona igual sin importar el orden de entrada (ordena internamente)', () => {
    const pricesPerM2 = [2800, 2000, 2600, 2200, 2400];

    const result = computeValuationPriceRange(pricesPerM2, 100);

    expect(result).toEqual({ minPrice: 220000, maxPrice: 260000 });
  });

  it('redondea el resultado a 2 decimales', () => {
    const pricesPerM2 = [1999.999, 2500.555];

    const result = computeValuationPriceRange(pricesPerM2, 50);

    // rank(25) sobre 2 valores = 0.25 -> interpola 25% entre ambos
    const expectedMin = Math.round((1999.999 + (2500.555 - 1999.999) * 0.25) * 50 * 100) / 100;
    const expectedMax = Math.round((1999.999 + (2500.555 - 1999.999) * 0.75) * 50 * 100) / 100;
    expect(result).toEqual({ minPrice: expectedMin, maxPrice: expectedMax });
  });

  it('lanza un error si se llama sin comparables', () => {
    expect(() => computeValuationPriceRange([], 100)).toThrow();
  });
});
