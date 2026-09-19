import { isPointInPolygon, type GeoPoint } from './point-in-polygon.util';

/**
 * Cuadrado de referencia: lat/lng en [0, 10] x [0, 10].
 */
const SQUARE: GeoPoint[] = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 10 },
  { lat: 10, lng: 10 },
  { lat: 10, lng: 0 },
];

describe('isPointInPolygon (ray-casting) - tasks.md 3.1', () => {
  it('devuelve true para un punto claramente dentro del poligono', () => {
    expect(isPointInPolygon({ lat: 5, lng: 5 }, SQUARE)).toBe(true);
  });

  it('devuelve false para un punto claramente fuera del poligono', () => {
    expect(isPointInPolygon({ lat: 20, lng: 20 }, SQUARE)).toBe(false);
  });

  it('devuelve false para un punto fuera alineado con un lado (fuera del rango del otro eje)', () => {
    expect(isPointInPolygon({ lat: 5, lng: -1 }, SQUARE)).toBe(false);
  });

  it('devuelve true para un punto exactamente sobre un vertice', () => {
    expect(isPointInPolygon({ lat: 0, lng: 0 }, SQUARE)).toBe(true);
  });

  it('devuelve true para un punto exactamente sobre el punto medio de un lado', () => {
    expect(isPointInPolygon({ lat: 0, lng: 5 }, SQUARE)).toBe(true);
  });

  it('devuelve true para un punto sobre un lado vertical del poligono', () => {
    expect(isPointInPolygon({ lat: 5, lng: 10 }, SQUARE)).toBe(true);
  });

  it('funciona con un poligono no convexo (forma de "L")', () => {
    const lShape: GeoPoint[] = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 10 },
      { lat: 5, lng: 10 },
      { lat: 5, lng: 5 },
      { lat: 10, lng: 5 },
      { lat: 10, lng: 0 },
    ];

    // Dentro de la parte "ancha" de la L
    expect(isPointInPolygon({ lat: 2, lng: 2 }, lShape)).toBe(true);
    // Dentro del hueco que la L deja fuera (esquina superior derecha)
    expect(isPointInPolygon({ lat: 8, lng: 8 }, lShape)).toBe(false);
  });

  it('devuelve false cuando el poligono tiene menos de 3 vertices', () => {
    expect(isPointInPolygon({ lat: 1, lng: 1 }, [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }])).toBe(
      false,
    );
  });
});
