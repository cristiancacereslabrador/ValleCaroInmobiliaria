import {
  getBoundingBox,
  getConservativeRadiusMeters,
  isWithinBoundingBox,
} from './bounding-box.util';
import { TransportMode } from './transport-mode.enum';

describe('getConservativeRadiusMeters (1.2)', () => {
  it('crece con el tiempo maximo para un mismo medio de transporte', () => {
    const radius10min = getConservativeRadiusMeters(10, TransportMode.DRIVING);
    const radius20min = getConservativeRadiusMeters(20, TransportMode.DRIVING);

    expect(radius20min).toBeGreaterThan(radius10min);
    expect(radius20min).toBe(radius10min * 2);
  });

  it('el radio a pie es menor que en transporte publico, y este menor que en coche, para el mismo tiempo', () => {
    const walking = getConservativeRadiusMeters(15, TransportMode.WALKING);
    const transit = getConservativeRadiusMeters(15, TransportMode.TRANSIT);
    const driving = getConservativeRadiusMeters(15, TransportMode.DRIVING);

    expect(walking).toBeLessThan(transit);
    expect(transit).toBeLessThan(driving);
  });

  it('devuelve un radio razonable (no cero, no absurdamente grande) para 15 minutos a pie', () => {
    const radius = getConservativeRadiusMeters(15, TransportMode.WALKING);

    // 6 km/h conservador => 1500m en 15 minutos.
    expect(radius).toBe(1500);
  });
});

describe('getBoundingBox / isWithinBoundingBox (1.2)', () => {
  const ORIGIN = { lat: 40.4167754, lng: -3.7037902 };

  it('produce una caja centrada en el punto (el centro esta dentro)', () => {
    const box = getBoundingBox(ORIGIN, 2000);

    expect(isWithinBoundingBox(ORIGIN, box)).toBe(true);
    expect(box.minLat).toBeLessThan(ORIGIN.lat);
    expect(box.maxLat).toBeGreaterThan(ORIGIN.lat);
    expect(box.minLng).toBeLessThan(ORIGIN.lng);
    expect(box.maxLng).toBeGreaterThan(ORIGIN.lng);
  });

  it('un punto claramente dentro del radio cae dentro de la caja', () => {
    const box = getBoundingBox(ORIGIN, 5000);
    // ~1.1km al norte aproximadamente (0.01 grados de latitud).
    const nearbyPoint = { lat: ORIGIN.lat + 0.01, lng: ORIGIN.lng };

    expect(isWithinBoundingBox(nearbyPoint, box)).toBe(true);
  });

  it('un punto claramente fuera del radio cae fuera de la caja', () => {
    const box = getBoundingBox(ORIGIN, 2000);
    const farPoint = { lat: ORIGIN.lat + 5, lng: ORIGIN.lng + 5 };

    expect(isWithinBoundingBox(farPoint, box)).toBe(false);
  });

  it('acota candidatas razonablemente: descarta puntos lejanos y conserva los cercanos', () => {
    const radiusMeters = getConservativeRadiusMeters(10, TransportMode.WALKING);
    const box = getBoundingBox(ORIGIN, radiusMeters);

    const candidates = [
      { id: 'cerca', lat: ORIGIN.lat + 0.001, lng: ORIGIN.lng },
      { id: 'lejos', lat: ORIGIN.lat + 1, lng: ORIGIN.lng + 1 },
    ];

    const within = candidates.filter((c) => isWithinBoundingBox({ lat: c.lat, lng: c.lng }, box));

    expect(within.map((c) => c.id)).toEqual(['cerca']);
  });
});
