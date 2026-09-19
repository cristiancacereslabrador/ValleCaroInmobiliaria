import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { PropertyType } from './entities/property-type.enum';
import { OperationType } from './entities/operation-type.enum';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Tests de integracion del controller con ValidationPipe real (sin base de
 * datos: PropertiesService esta mockeado) para verificar el contrato HTTP
 * descrito en tasks.md 3.1-3.5 y specs/property-catalog/spec.md.
 */
describe('PropertiesController (integration)', () => {
  let app: INestApplication;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPriceHistory: jest.fn(),
  };

  const validPayload = {
    type: PropertyType.APARTMENT,
    operationType: OperationType.SALE,
    price: 150000,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [PropertiesController],
      providers: [{ provide: PropertiesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/properties (3.1)', () => {
    it('devuelve 201 cuando la creacion es valida', async () => {
      const created = { id: 'uuid-1', ...validPayload };
      mockService.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(created);
      expect(mockService.create).toHaveBeenCalledTimes(1);
    });

    it('devuelve un error de validacion cuando faltan datos obligatorios (sin tipo ni precio)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send({ operationType: OperationType.SALE });

      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('devuelve un error de validacion cuando el tipo de vivienda no es soportado', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send({ ...validPayload, type: 'castle' });

      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('devuelve un error de validacion cuando el tipo de operacion no es "sale" ni "rent"', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send({ ...validPayload, operationType: 'exchange' });

      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('devuelve un error de validacion cuando las coordenadas estan fuera de rango', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send({ ...validPayload, latitude: 120, longitude: -3 });

      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('acepta la creacion sin indicar ascensor, reforma ni procedencia bancaria (quedan como no indicados - 1.2)', async () => {
      const created = { id: 'uuid-2', ...validPayload };
      mockService.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          hasElevator: expect.anything(),
          needsRenovation: expect.anything(),
        }),
      );
    });

    it('acepta valores booleanos explicitos para ascensor y reforma (1.2)', async () => {
      const payload = {
        ...validPayload,
        hasElevator: true,
        needsRenovation: false,
      };
      mockService.create.mockResolvedValue({ id: 'uuid-3', ...payload });

      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send(payload);

      expect(response.status).toBe(201);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({ hasElevator: true, needsRenovation: false }),
      );
    });

    it('devuelve un error de validacion cuando ascensor no es un booleano', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send({ ...validPayload, hasElevator: 'yes' });

      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('acepta la creacion sin ciudad ni codigo postal (1.2)', async () => {
      const created = { id: 'uuid-4', ...validPayload };
      mockService.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.not.objectContaining({ city: expect.anything(), postalCode: expect.anything() }),
      );
    });

    it('acepta ciudad y codigo postal cuando se indican (1.2)', async () => {
      const payload = { ...validPayload, city: 'San Cristóbal', state: 'Táchira' };
      mockService.create.mockResolvedValue({ id: 'uuid-5', ...payload });

      const response = await request(app.getHttpServer())
        .post('/api/v1/properties')
        .send(payload);

      expect(response.status).toBe(201);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'San Cristóbal', state: 'Táchira' }),
      );
    });
  });

  describe('PATCH /api/v1/properties/:id (3.2)', () => {
    const id = '11111111-1111-1111-1111-111111111111';

    it('edita una propiedad existente', async () => {
      const updated = { id, ...validPayload, price: 200000 };
      mockService.update.mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/properties/${id}`)
        .send({ price: 200000 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updated);
      expect(mockService.update).toHaveBeenCalledWith(id, { price: 200000 });
    });

    it('devuelve error al editar un id inexistente', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundException('not found'),
      );

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/properties/${id}`)
        .send({ price: 200000 });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/properties/:id (3.3)', () => {
    const id = '11111111-1111-1111-1111-111111111111';

    it('elimina una propiedad existente', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer()).delete(
        `/api/v1/properties/${id}`,
      );

      expect(response.status).toBe(204);
      expect(mockService.remove).toHaveBeenCalledWith(id);
    });

    it('devuelve error al eliminar un id inexistente', async () => {
      mockService.remove.mockRejectedValue(
        new NotFoundException('not found'),
      );

      const response = await request(app.getHttpServer()).delete(
        `/api/v1/properties/${id}`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/properties/:id (3.4)', () => {
    const id = '11111111-1111-1111-1111-111111111111';

    it('devuelve todos los campos de una propiedad existente', async () => {
      const property = { id, ...validPayload };
      mockService.findOne.mockResolvedValue(property);

      const response = await request(app.getHttpServer()).get(
        `/api/v1/properties/${id}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(property);
    });

    it('devuelve 404 para un id inexistente', async () => {
      mockService.findOne.mockRejectedValue(
        new NotFoundException('not found'),
      );

      const response = await request(app.getHttpServer()).get(
        `/api/v1/properties/${id}`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/properties/:id/price-history (2.2)', () => {
    const id = '11111111-1111-1111-1111-111111111111';

    it('devuelve el historico de precio en orden cronologico', async () => {
      const history = [
        { id: 'h1', propertyId: id, price: '100000', recordedAt: '2026-01-01T00:00:00.000Z' },
        { id: 'h2', propertyId: id, price: '120000', recordedAt: '2026-02-01T00:00:00.000Z' },
      ];
      mockService.getPriceHistory.mockResolvedValue(history);

      const response = await request(app.getHttpServer()).get(
        `/api/v1/properties/${id}/price-history`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(history);
      expect(mockService.getPriceHistory).toHaveBeenCalledWith(id);
    });

    it('devuelve 404 si la propiedad no existe', async () => {
      mockService.getPriceHistory.mockRejectedValue(new NotFoundException('not found'));

      const response = await request(app.getHttpServer()).get(
        `/api/v1/properties/${id}/price-history`,
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/properties (3.5)', () => {
    it('lista sin filtros', async () => {
      mockService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer()).get('/api/v1/properties');

      expect(response.status).toBe(200);
      expect(mockService.findAll).toHaveBeenCalledWith({});
    });

    it('filtra por tipo de vivienda y tipo de operacion', async () => {
      mockService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/properties')
        .query({ type: PropertyType.QUINTA, operationType: OperationType.RENT });

      expect(mockService.findAll).toHaveBeenCalledWith({
        type: PropertyType.QUINTA,
        operationType: OperationType.RENT,
      });
    });

    it('filtra por rango de precio', async () => {
      mockService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/properties')
        .query({ minPrice: 100000, maxPrice: 300000 });

      expect(mockService.findAll).toHaveBeenCalledWith({
        minPrice: 100000,
        maxPrice: 300000,
      });
    });

    it('filtra por ascensor, planta baja y reforma (2.1)', async () => {
      mockService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/api/v1/properties').query({
        hasElevator: 'true',
        groundFloor: 'false',
        needsRenovation: 'true',
      });

      expect(mockService.findAll).toHaveBeenCalledWith({
        hasElevator: true,
        groundFloor: false,
        needsRenovation: true,
      });
    });

    it('combina los filtros nuevos con tipo, operacion y precio en una misma peticion (2.2)', async () => {
      mockService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/api/v1/properties').query({
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        minPrice: 100000,
        maxPrice: 300000,
        hasElevator: 'true',
      });

      expect(mockService.findAll).toHaveBeenCalledWith({
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        minPrice: 100000,
        maxPrice: 300000,
        hasElevator: true,
      });
    });

    it('devuelve un error de validacion cuando un filtro booleano no es "true"/"false"', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .query({ hasElevator: 'yes' });

      expect(response.status).toBe(400);
      expect(mockService.findAll).not.toHaveBeenCalled();
    });

    describe('busqueda por area geografica (3.2)', () => {
      const validArea = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
      ];

      it('acepta un poligono valido de al menos 3 vertices y lo reenvia al servicio', async () => {
        mockService.findAll.mockResolvedValue([]);

        const response = await request(app.getHttpServer())
          .get('/api/v1/properties')
          .query({ area: JSON.stringify(validArea) });

        expect(response.status).toBe(200);
        expect(mockService.findAll).toHaveBeenCalledWith({ area: validArea });
      });

      it('rechaza un poligono con menos de 3 vertices', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/properties')
          .query({ area: JSON.stringify([{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }]) });

        expect(response.status).toBe(400);
        expect(mockService.findAll).not.toHaveBeenCalled();
      });

      it('rechaza un poligono con vertices fuera de rango', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/properties')
          .query({
            area: JSON.stringify([
              { lat: 0, lng: 0 },
              { lat: 0, lng: 10 },
              { lat: 200, lng: 10 },
            ]),
          });

        expect(response.status).toBe(400);
        expect(mockService.findAll).not.toHaveBeenCalled();
      });

      it('rechaza un valor de area que no es JSON valido', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/properties')
          .query({ area: 'no-es-json' });

        expect(response.status).toBe(400);
        expect(mockService.findAll).not.toHaveBeenCalled();
      });
    });
  });
});
