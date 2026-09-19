import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { SimilarPropertiesController } from './similar-properties.controller';
import { SimilarPropertiesService } from './similar-properties.service';

/**
 * Tests de integracion del controller (sin base de datos: el servicio esta
 * mockeado) para verificar el contrato HTTP de tasks.md 1.3
 * (`GET /api/v1/properties/:id/similar`).
 */
describe('SimilarPropertiesController (integration)', () => {
  let app: INestApplication;

  const mockService = { getSimilar: jest.fn() };
  const id = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [SimilarPropertiesController],
      providers: [{ provide: SimilarPropertiesService, useValue: mockService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('devuelve las propiedades similares de una propiedad existente', async () => {
    const similar = [{ id: 'similar-1', coverPhotoUrl: null, price: '150000', type: 'flat' }];
    mockService.getSimilar.mockResolvedValue(similar);

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/similar`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(similar);
    expect(mockService.getSimilar).toHaveBeenCalledWith(id);
  });

  it('devuelve una lista vacia cuando no hay propiedades similares', async () => {
    mockService.getSimilar.mockResolvedValue([]);

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/similar`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('devuelve 404 si la propiedad no existe', async () => {
    mockService.getSimilar.mockRejectedValue(new NotFoundException('not found'));

    const response = await request(app.getHttpServer()).get(`/api/v1/properties/${id}/similar`);

    expect(response.status).toBe(404);
  });

  it('devuelve 400 si el id no es un UUID valido', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/properties/not-a-uuid/similar');

    expect(response.status).toBe(400);
  });
});
