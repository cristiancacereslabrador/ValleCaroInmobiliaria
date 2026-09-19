import { computeMonthlyPriceTrend } from './price-trend.util';

describe('computeMonthlyPriceTrend (4.1)', () => {
  it('calcula el precio medio por m2 agregado en buckets mensuales, ordenados cronologicamente', () => {
    const points = [
      // Enero 2026: dos puntos -> media de precio/m2
      { propertyId: 'p1', price: 200000, surfaceM2: 100, recordedAt: new Date('2026-01-05') }, // 2000
      { propertyId: 'p2', price: 240000, surfaceM2: 100, recordedAt: new Date('2026-01-20') }, // 2400
      // Febrero 2026: un punto
      { propertyId: 'p3', price: 330000, surfaceM2: 110, recordedAt: new Date('2026-02-10') }, // 3000
    ];

    const series = computeMonthlyPriceTrend(points);

    expect(series).toEqual([
      { month: '2026-01', averagePricePerM2: 2200 },
      { month: '2026-02', averagePricePerM2: 3000 },
    ]);
  });

  it('agrupa varios puntos del mismo mes de distintas propiedades en un unico bucket', () => {
    const points = [
      { propertyId: 'p1', price: 100000, surfaceM2: 50, recordedAt: new Date('2026-03-01') }, // 2000
      { propertyId: 'p2', price: 150000, surfaceM2: 50, recordedAt: new Date('2026-03-28') }, // 3000
      { propertyId: 'p3', price: 250000, surfaceM2: 50, recordedAt: new Date('2026-03-15') }, // 5000
    ];

    const series = computeMonthlyPriceTrend(points);

    expect(series).toEqual([{ month: '2026-03', averagePricePerM2: expect.closeTo(10000 / 3, 2) }]);
  });

  it('descarta puntos sin superficie valida (0 o negativa) en vez de producir NaN/Infinity', () => {
    const points = [
      { propertyId: 'p1', price: 100000, surfaceM2: 0, recordedAt: new Date('2026-04-01') },
      { propertyId: 'p2', price: 100000, surfaceM2: -10, recordedAt: new Date('2026-04-01') },
      { propertyId: 'p3', price: 200000, surfaceM2: 100, recordedAt: new Date('2026-04-01') },
    ];

    const series = computeMonthlyPriceTrend(points);

    expect(series).toEqual([{ month: '2026-04', averagePricePerM2: 2000 }]);
  });

  it('devuelve una serie vacia cuando no hay puntos', () => {
    expect(computeMonthlyPriceTrend([])).toEqual([]);
  });
});
