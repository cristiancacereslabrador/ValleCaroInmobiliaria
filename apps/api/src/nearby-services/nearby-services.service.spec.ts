import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of, throwError } from 'rxjs';
import { Repository } from 'typeorm';
import { NearbyServicesService } from './nearby-services.service';
import { Property } from '../properties/entities/property.entity';

function googleResponse(status: string, results: Array<{ place_id: string; name: string; lat: number; lng: number }> = []) {
  return of({
    data: {
      status,
      results: results.map((r) => ({
        place_id: r.place_id,
        name: r.name,
        geometry: { location: { lat: r.lat, lng: r.lng } },
      })),
    },
  });
}

describe('NearbyServicesService', () => {
  let service: NearbyServicesService;
  let repository: jest.Mocked<Repository<Property>>;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  const PROPERTY_COORDS = { latitude: '40.4167754', longitude: '-3.7037902' };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        if (key === 'GOOGLE_MAPS_SERVER_API_KEY') return 'fake-api-key';
        if (key === 'NEARBY_SERVICES_RADIUS_METERS') return defaultValue ?? 1000;
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NearbyServicesService,
        {
          provide: getRepositoryToken(Property),
          useValue: { findOne: jest.fn() },
        },
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(NearbyServicesService);
    repository = module.get(getRepositoryToken(Property));
  });

  describe('getNearbyServicesForCoordinates (3.1 - agrupacion por categoria con distancia)', () => {
    it('agrupa correctamente los resultados por categoria con su distancia', async () => {
      // school (1 llamada), transitStops (3 llamadas: transit_station, bus_station, subway_station),
      // supermarkets (1 llamada) = 5 llamadas HTTP en total.
      httpService.get.mockImplementation((_url: string, config: { params: { type: string } }) => {
        switch (config.params.type) {
          case 'school':
            return googleResponse('OK', [
              { place_id: 'school-1', name: 'Colegio Cercano', lat: 40.4168, lng: -3.7038 },
            ]);
          case 'transit_station':
            return googleResponse('OK', [
              { place_id: 'transit-1', name: 'Estacion Sol', lat: 40.417, lng: -3.7 },
            ]);
          case 'bus_station':
            return googleResponse('ZERO_RESULTS');
          case 'subway_station':
            return googleResponse('OK', [
              { place_id: 'transit-1', name: 'Estacion Sol (metro)', lat: 40.417, lng: -3.7 },
            ]);
          case 'supermarket':
            return googleResponse('OK', [
              { place_id: 'market-1', name: 'Supermercado A', lat: 40.42, lng: -3.71 },
            ]);
          default:
            return googleResponse('ZERO_RESULTS');
        }
      });

      const result = await service.getNearbyServicesForCoordinates(40.4167754, -3.7037902);

      expect(result.available).toBe(true);
      if (!result.available) throw new Error('expected available result');

      expect(result.categories.schools).toEqual([
        { name: 'Colegio Cercano', distanceMeters: expect.any(Number) },
      ]);
      expect(result.categories.supermarkets).toEqual([
        { name: 'Supermercado A', distanceMeters: expect.any(Number) },
      ]);
      // El mismo place_id devuelto por transit_station y subway_station se
      // deduplica, quedando un unico punto de transporte.
      expect(result.categories.transitStops).toHaveLength(1);
      expect(result.categories.transitStops[0].name).toBe('Estacion Sol');
      expect(result.categories.transitStops[0].distanceMeters).toBeGreaterThanOrEqual(0);
    });

    it('devuelve el entorno vacio (sin error) cuando no hay puntos de interes en el radio', async () => {
      httpService.get.mockReturnValue(googleResponse('ZERO_RESULTS'));

      const result = await service.getNearbyServicesForCoordinates(40.4167754, -3.7037902);

      expect(result).toEqual({
        available: true,
        categories: { schools: [], transitStops: [], supermarkets: [] },
      });
    });

    it('trata un status distinto de OK/ZERO_RESULTS como servicio no disponible', async () => {
      httpService.get.mockReturnValue(googleResponse('REQUEST_DENIED'));

      const result = await service.getNearbyServicesForCoordinates(40.4167754, -3.7037902);

      expect(result).toEqual({ available: false, reason: 'service-unavailable' });
    });

    it('trata un fallo de red como servicio no disponible', async () => {
      httpService.get.mockReturnValue(throwError(() => new Error('network error')));

      const result = await service.getNearbyServicesForCoordinates(40.4167754, -3.7037902);

      expect(result).toEqual({ available: false, reason: 'service-unavailable' });
    });

    it('devuelve servicio no disponible sin llamar a Google si no hay API key configurada', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: unknown) =>
        key === 'GOOGLE_MAPS_SERVER_API_KEY' ? undefined : defaultValue,
      );

      const result = await service.getNearbyServicesForCoordinates(40.4167754, -3.7037902);

      expect(result).toEqual({ available: false, reason: 'service-unavailable' });
      expect(httpService.get).not.toHaveBeenCalled();
    });
  });

  describe('getForProperty (3.2)', () => {
    it('lanza NotFoundException si la propiedad no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getForProperty('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('informa que no hay entorno disponible si la propiedad no tiene coordenadas', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue({
        id: 'no-coords-id',
        latitude: null,
        longitude: null,
      });

      const result = await service.getForProperty('no-coords-id');

      expect(result).toEqual({ available: false, reason: 'no-coordinates' });
      expect(httpService.get).not.toHaveBeenCalled();
    });

    it('consulta el entorno cuando la propiedad tiene coordenadas', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue({ id: 'with-coords-id', ...PROPERTY_COORDS });
      httpService.get.mockReturnValue(googleResponse('ZERO_RESULTS'));

      const result = await service.getForProperty('with-coords-id');

      expect(result.available).toBe(true);
      expect(httpService.get).toHaveBeenCalled();
    });
  });
});
