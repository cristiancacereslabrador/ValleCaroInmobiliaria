import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { NearbyServicesController } from './nearby-services.controller';
import { NearbyServicesService } from './nearby-services.service';

/**
 * Tests de integracion del controller (sin base de datos: el servicio esta
 * mockeado) para verificar el contrato HTTP de tasks.md 3.2 y los escenarios
 * de specs/nearby-services/spec.md.
 */
describe('NearbyServicesController (integration)', () => {
  let app: INestApplication;

  const mockService = { getForProperty: jest.fn() };
  const id = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [NearbyServicesController],
      providers: [{ provide: NearbyServicesService, useValue: mockService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve el entorno agrupado por categoria cuando hay resultados', async () => {
    const categories = {
      schools: [{ name: 'Colegio A', distanceMeters: 200 }],
      transitStops: [{ name: 'Parada Bus', distanceMeters: 150 }],
      supermarkets: [{ name: 'Super B', distanceMeters: 300 }],
    };
    mockService.getForProperty.mockResolvedValue({ available: true, categories });

    const response = await request(app.getHttpServer()).get(
      `/api/v1/properties/${id}/nearby-services`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ available: true, categories });
  });

  it('devuelve el entorno vacio (sin error) cuando no hay puntos de interes', async () => {
    mockService.getForProperty.mockResolvedValue({
      available: true,
      categories: { schools: [], transitStops: [], supermarkets: [] },
    });

    const response = await request(app.getHttpServer()).get(
      `/api/v1/properties/${id}/nearby-services`,
    );

    expect(response.status).toBe(200);
    expect(response.body.categories).toEqual({ schools: [], transitStops: [], supermarkets: [] });
  });

  it('informa que no hay entorno disponible si la propiedad no tiene coordenadas', async () => {
    mockService.getForProperty.mockResolvedValue({ available: false, reason: 'no-coordinates' });

    const response = await request(app.getHttpServer()).get(
      `/api/v1/properties/${id}/nearby-services`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ available: false, reason: 'no-coordinates' });
  });

  it('informa de servicio no disponible cuando Google Places falla', async () => {
    mockService.getForProperty.mockResolvedValue({ available: false, reason: 'service-unavailable' });

    const response = await request(app.getHttpServer()).get(
      `/api/v1/properties/${id}/nearby-services`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ available: false, reason: 'service-unavailable' });
  });

  it('devuelve 404 si la propiedad no existe', async () => {
    mockService.getForProperty.mockRejectedValue(new NotFoundException('not found'));

    const response = await request(app.getHttpServer()).get(
      `/api/v1/properties/${id}/nearby-services`,
    );

    expect(response.status).toBe(404);
  });
});
