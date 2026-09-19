import { haversineDistanceMeters } from './haversine.util';

describe('haversineDistanceMeters', () => {
  it('devuelve 0 para el mismo punto', () => {
    expect(haversineDistanceMeters({ lat: 40.4168, lng: -3.7038 }, { lat: 40.4168, lng: -3.7038 })).toBe(0);
  });

  it('calcula una distancia aproximada correcta entre dos puntos conocidos', () => {
    // Dos puntos cercanos (~2.4 km en linea recta).
    const sol = { lat: 40.4167754, lng: -3.7037902 };
    const atocha = { lat: 40.4066, lng: -3.6892 };

    const distance = haversineDistanceMeters(sol, atocha);

    expect(distance).toBeGreaterThan(1500);
    expect(distance).toBeLessThan(3000);
  });

  it('1 grado de latitud equivale aproximadamente a 111 km', () => {
    const distance = haversineDistanceMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });

    expect(distance).toBeGreaterThan(110000);
    expect(distance).toBeLessThan(112000);
  });
});
