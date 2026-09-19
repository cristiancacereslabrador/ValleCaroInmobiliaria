import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('fake-api-key') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(GeocodingService);
  });

  it('resuelve latitud/longitud a partir de una direccion (mockeando la llamada HTTP)', async () => {
    httpService.get.mockReturnValue(
      of({
        data: {
          status: 'OK',
          results: [
            {
              geometry: { location: { lat: 7.7497768, lng: -72.2293373 } },
            },
          ],
        },
      }),
    );

    const result = await service.geocodeAddress('Plaza Libertador, San Cristóbal, Táchira');

    expect(result).toEqual({ latitude: 7.7497768, longitude: -72.2293373 });
    expect(httpService.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { params: { address: 'Plaza Libertador, San Cristóbal, Táchira', key: 'fake-api-key' } },
    );
  });

  it('devuelve null cuando la direccion no es geocodificable (status distinto de OK)', async () => {
    httpService.get.mockReturnValue(
      of({ data: { status: 'ZERO_RESULTS', results: [] } }),
    );

    const result = await service.geocodeAddress('direccion inexistente xyz');

    expect(result).toBeNull();
  });

  it('devuelve null (sin lanzar) cuando el servicio de Google Maps falla', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('network error')));

    const result = await service.geocodeAddress('Calle Falsa 123');

    expect(result).toBeNull();
  });

  it('devuelve null sin llamar al servicio si no hay API key configurada', async () => {
    configService.get.mockReturnValue(undefined);

    const result = await service.geocodeAddress('Calle Falsa 123');

    expect(result).toBeNull();
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
