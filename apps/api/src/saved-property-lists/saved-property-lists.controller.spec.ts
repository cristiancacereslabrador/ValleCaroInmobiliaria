import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { SavedPropertyListsController } from './saved-property-lists.controller';
import { SavedPropertyListsService } from './saved-property-lists.service';

/**
 * Tests de integracion del controller con ValidationPipe real (sin base de
 * datos: SavedPropertyListsService esta mockeado), igual que
 * properties.controller.spec.ts.
 */
describe('SavedPropertyListsController (integration)', () => {
  let app: INestApplication;

  const mockService = {
    create: jest.fn(),
    findByManagementToken: jest.fn(),
    findByShareToken: jest.fn(),
    addProperty: jest.fn(),
    removeProperty: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [SavedPropertyListsController],
      providers: [{ provide: SavedPropertyListsService, useValue: mockService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/saved-property-lists (2.1)', () => {
    it('devuelve 201 con ambos tokens al crear una lista valida', async () => {
      const created = {
        id: 'list-id',
        name: 'TOP 3',
        managementToken: 'mgmt-token',
        shareToken: 'share-token',
        properties: [],
      };
      mockService.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-property-lists')
        .send({ name: 'TOP 3' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(created);
      expect(mockService.create).toHaveBeenCalledWith({ name: 'TOP 3' });
    });

    it('devuelve un error de validacion cuando falta el nombre', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-property-lists')
        .send({});

      expect(response.status).toBe(400);
      expect(mockService.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/saved-property-lists/manage/:managementToken (2.3)', () => {
    it('devuelve la lista con ambos identificadores', async () => {
      const list = { name: 'TOP 3', managementToken: 'mgmt-token', shareToken: 'share-token', properties: [] };
      mockService.findByManagementToken.mockResolvedValue(list);

      const response = await request(app.getHttpServer()).get(
        '/api/v1/saved-property-lists/manage/mgmt-token',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(list);
    });

    it('devuelve 404 con un identificador de gestion inexistente', async () => {
      mockService.findByManagementToken.mockRejectedValue(new NotFoundException('not found'));

      const response = await request(app.getHttpServer()).get(
        '/api/v1/saved-property-lists/manage/no-existe',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/saved-property-lists/shared/:shareToken (2.3)', () => {
    it('devuelve la lista sin el identificador de gestion', async () => {
      const list = { name: 'TOP 3', properties: [] };
      mockService.findByShareToken.mockResolvedValue(list);

      const response = await request(app.getHttpServer()).get(
        '/api/v1/saved-property-lists/shared/share-token',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(list);
      expect(response.body).not.toHaveProperty('managementToken');
    });

    it('devuelve 404 con un identificador de solo lectura inexistente', async () => {
      mockService.findByShareToken.mockRejectedValue(new NotFoundException('not found'));

      const response = await request(app.getHttpServer()).get(
        '/api/v1/saved-property-lists/shared/no-existe',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/saved-property-lists/manage/:managementToken/items (2.2)', () => {
    it('añade una propiedad a la lista', async () => {
      const updated = { name: 'TOP 3', properties: [{ id: 'prop-1' }] };
      mockService.addProperty.mockResolvedValue(updated);

      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-property-lists/manage/mgmt-token/items')
        .send({ propertyId: '11111111-1111-4111-9111-111111111111' });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(updated);
      expect(mockService.addProperty).toHaveBeenCalledWith('mgmt-token', {
        propertyId: '11111111-1111-4111-9111-111111111111',
      });
    });

    it('devuelve un error de validacion cuando propertyId no es un uuid', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-property-lists/manage/mgmt-token/items')
        .send({ propertyId: 'no-es-un-uuid' });

      expect(response.status).toBe(400);
      expect(mockService.addProperty).not.toHaveBeenCalled();
    });

    it('devuelve 404 con un identificador de gestion invalido', async () => {
      mockService.addProperty.mockRejectedValue(new NotFoundException('not found'));

      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-property-lists/manage/invalido/items')
        .send({ propertyId: '11111111-1111-4111-9111-111111111111' });

      expect(response.status).toBe(404);
    });

    it('devuelve 404 al intentar modificar la lista usando su identificador de solo lectura', async () => {
      mockService.addProperty.mockRejectedValue(new NotFoundException('not found'));

      const response = await request(app.getHttpServer())
        .post('/api/v1/saved-property-lists/manage/share-token/items')
        .send({ propertyId: '11111111-1111-4111-9111-111111111111' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/saved-property-lists/manage/:managementToken/items/:propertyId (2.2)', () => {
    it('quita una propiedad de la lista', async () => {
      mockService.removeProperty.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer()).delete(
        '/api/v1/saved-property-lists/manage/mgmt-token/items/11111111-1111-4111-9111-111111111111',
      );

      expect(response.status).toBe(204);
      expect(mockService.removeProperty).toHaveBeenCalledWith(
        'mgmt-token',
        '11111111-1111-4111-9111-111111111111',
      );
    });

    it('devuelve 404 con un identificador de gestion invalido', async () => {
      mockService.removeProperty.mockRejectedValue(new NotFoundException('not found'));

      const response = await request(app.getHttpServer()).delete(
        '/api/v1/saved-property-lists/manage/invalido/items/11111111-1111-4111-9111-111111111111',
      );

      expect(response.status).toBe(404);
    });
  });
});
