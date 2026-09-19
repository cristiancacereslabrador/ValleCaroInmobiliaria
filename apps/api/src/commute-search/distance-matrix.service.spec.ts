import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { DistanceMatrixError, DistanceMatrixService } from './distance-matrix.service';
import { TransportMode } from './transport-mode.enum';

function distanceMatrixResponse(
  status: string,
  rows: Array<{ elementStatus: string; durationSeconds?: number }> = [],
) {
  return of({
    data: {
      status,
      rows: rows.map((row) => ({
        elements: [
          {
            status: row.elementStatus,
            ...(row.durationSeconds !== undefined
              ? { duration: { value: row.durationSeconds, text: `${row.durationSeconds}s` } }
              : {}),
          },
        ],
      })),
    },
  });
}

describe('DistanceMatrixService (1.1)', () => {
  let service: DistanceMatrixService;
  let httpService: { get: jest.Mock };
  let configService: { get: jest.Mock };

  const DESTINATION = { lat: 40.4167754, lng: -3.7037902 };

  beforeEach(async () => {
    httpService = { get: jest.fn() };
    configService = { get: jest.fn().mockReturnValue('fake-api-key') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistanceMatrixService,
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(DistanceMatrixService);
  });

  it('interpreta correctamente la respuesta, devolviendo el tiempo de trayecto (segundos) por origen', async () => {
    httpService.get.mockReturnValue(
      distanceMatrixResponse('OK', [
        { elementStatus: 'OK', durationSeconds: 600 },
        { elementStatus: 'OK', durationSeconds: 1200 },
      ]),
    );

    const result = await service.getDurationsSeconds(
      [
        { lat: 40.41, lng: -3.7 },
        { lat: 40.42, lng: -3.71 },
      ],
      DESTINATION,
      TransportMode.DRIVING,
    );

    expect(result).toEqual([600, 1200]);
    expect(httpService.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: '40.41,-3.7|40.42,-3.71',
          destinations: '40.4167754,-3.7037902',
          mode: TransportMode.DRIVING,
          key: 'fake-api-key',
        },
      },
    );
  });

  it('devuelve null para el origen cuya ruta concreta no es resoluble (element status distinto de OK)', async () => {
    httpService.get.mockReturnValue(
      distanceMatrixResponse('OK', [
        { elementStatus: 'OK', durationSeconds: 300 },
        { elementStatus: 'ZERO_RESULTS' },
      ]),
    );

    const result = await service.getDurationsSeconds(
      [
        { lat: 40.41, lng: -3.7 },
        { lat: 40.42, lng: -3.71 },
      ],
      DESTINATION,
      TransportMode.WALKING,
    );

    expect(result).toEqual([300, null]);
  });

  it('devuelve un array vacio sin llamar a la API si no hay origenes', async () => {
    const result = await service.getDurationsSeconds([], DESTINATION, TransportMode.DRIVING);

    expect(result).toEqual([]);
    expect(httpService.get).not.toHaveBeenCalled();
  });

  it('divide en lotes cuando hay mas de 25 origenes', async () => {
    httpService.get.mockImplementation((_url: string, config: { params: { origins: string } }) => {
      const count = config.params.origins.split('|').length;
      return distanceMatrixResponse(
        'OK',
        Array.from({ length: count }, () => ({ elementStatus: 'OK', durationSeconds: 100 })),
      );
    });

    const origins = Array.from({ length: 30 }, (_, i) => ({ lat: 40 + i * 0.001, lng: -3.7 }));

    const result = await service.getDurationsSeconds(origins, DESTINATION, TransportMode.DRIVING);

    expect(result).toHaveLength(30);
    expect(httpService.get).toHaveBeenCalledTimes(2);
  });

  it('lanza DistanceMatrixError cuando el status de nivel superior no es OK', async () => {
    httpService.get.mockReturnValue(distanceMatrixResponse('REQUEST_DENIED'));

    await expect(
      service.getDurationsSeconds([{ lat: 40.41, lng: -3.7 }], DESTINATION, TransportMode.DRIVING),
    ).rejects.toThrow(DistanceMatrixError);
  });

  it('lanza DistanceMatrixError cuando falla la llamada de red', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('network error')));

    await expect(
      service.getDurationsSeconds([{ lat: 40.41, lng: -3.7 }], DESTINATION, TransportMode.DRIVING),
    ).rejects.toThrow(DistanceMatrixError);
  });

  it('lanza DistanceMatrixError sin llamar a la API si no hay API key configurada', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(
      service.getDurationsSeconds([{ lat: 40.41, lng: -3.7 }], DESTINATION, TransportMode.DRIVING),
    ).rejects.toThrow(DistanceMatrixError);
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
