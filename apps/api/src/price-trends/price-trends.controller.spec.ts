import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PriceTrendsController } from './price-trends.controller';
import { PriceTrendsService } from './price-trends.service';

/**
 * Tests de integracion del controller (sin base de datos: el servicio esta
 * mockeado) para verificar el contrato HTTP de tasks.md 4.3 y los escenarios
 * de specs/price-trends/spec.md.
 */
describe('PriceTrendsController (integration)', () => {
  let app: INestApplication;

  const mockService = { getForProperty: jest.fn() };
  const id = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [PriceTrendsController],
      providers: [{ provide: PriceTrendsService, useValue: mockService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve la serie de evolucion de precio cuando la zona tiene datos suficientes', async () => {
    const series = [{ month: '2026-01', averagePricePerM2: 2000 }];
    mockService.getForProperty.mockResolvedValue({ available: true, series });

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/price-trend`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ available: true, series });
  });

  it('informa de datos insuficientes cuando la zona no alcanza el umbral minimo', async () => {
    mockService.getForProperty.mockResolvedValue({ available: false, reason: 'insufficient-data' });

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/price-trend`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ available: false, reason: 'insufficient-data' });
  });

  it('informa de que no hay zona cuando la propiedad no tiene ciudad/codigo postal', async () => {
    mockService.getForProperty.mockResolvedValue({ available: false, reason: 'no-zone' });

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/price-trend`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ available: false, reason: 'no-zone' });
  });

  it('devuelve 404 si la propiedad no existe', async () => {
    mockService.getForProperty.mockRejectedValue(new NotFoundException('not found'));

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/price-trend`);

    expect(response.status).toBe(404);
  });
});
