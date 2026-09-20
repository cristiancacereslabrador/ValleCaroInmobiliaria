import { BadRequestException, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropertyValuationEstimatorController } from './property-valuation-estimator.controller';
import { PropertyValuationEstimatorService } from './property-valuation-estimator.service';
import { PropertyType } from '../properties/entities/property-type.enum';

/**
 * Tests de integracion del controller (sin base de datos: el servicio esta
 * mockeado) para verificar el contrato HTTP de tasks.md 2.3 y los escenarios
 * de specs/property-valuation-estimator/spec.md, igual que
 * `price-trends.controller.spec.ts`.
 */
describe('PropertyValuationEstimatorController (integration)', () => {
  let app: INestApplication;

  const mockService = { estimate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [PropertyValuationEstimatorController],
      providers: [{ provide: PropertyValuationEstimatorService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const validBody = {
    type: PropertyType.APARTMENT,
    city: 'San Cristóbal',
    postalCode: '5001',
    surfaceM2: 90,
    bedrooms: 3,
    status: 'buen estado',
  };

  it('devuelve el rango estimado cuando hay comparables suficientes (Escenario "Comparables suficientes para venta")', async () => {
    const responseBody = {
      criteria: { ...validBody, city: 'San Cristóbal', postalCode: '5001' },
      sale: { available: true, minPrice: 180000, maxPrice: 220000, comparablesCount: 5 },
      rent: { available: false, reason: 'insufficient-data' },
      disclaimer: 'Estimación orientativa...',
    };
    mockService.estimate.mockResolvedValue(responseBody);

    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send(validBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(responseBody);
  });

  it('rechaza la solicitud con un 400 cuando falta el tipo de vivienda', async () => {
    const { type, ...rest } = validBody;

    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send(rest);

    expect(response.status).toBe(400);
    expect(mockService.estimate).not.toHaveBeenCalled();
  });

  it('rechaza la solicitud con un 400 cuando falta la superficie', async () => {
    const { surfaceM2, ...rest } = validBody;

    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send(rest);

    expect(response.status).toBe(400);
    expect(mockService.estimate).not.toHaveBeenCalled();
  });

  it('rechaza la solicitud con un 400 cuando falta la zona (ciudad y codigo postal), delegado por el servicio', async () => {
    const { city, postalCode, ...rest } = validBody;
    mockService.estimate.mockRejectedValue(
      new BadRequestException('Debe indicar ciudad o código postal'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send(rest);

    expect(response.status).toBe(400);
  });

  it('acepta la solicitud sin habitaciones ni estado (opcionales)', async () => {
    mockService.estimate.mockResolvedValue({
      criteria: {
        type: PropertyType.APARTMENT,
        city: 'San Cristóbal',
        postalCode: null,
        surfaceM2: 90,
        bedrooms: null,
        status: null,
      },
      sale: { available: false, reason: 'insufficient-data' },
      rent: { available: false, reason: 'insufficient-data' },
      disclaimer: 'Estimación orientativa...',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send({ type: PropertyType.APARTMENT, city: 'San Cristóbal', surfaceM2: 90 });

    expect(response.status).toBe(200);
    expect(mockService.estimate).toHaveBeenCalledWith(
      expect.objectContaining({ type: PropertyType.APARTMENT, city: 'San Cristóbal', surfaceM2: 90 }),
    );
  });

  it('rechaza un tipo de vivienda no soportado', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send({ ...validBody, type: 'castle' });

    expect(response.status).toBe(400);
    expect(mockService.estimate).not.toHaveBeenCalled();
  });

  it('rechaza a un visitante sin sesión de staff', async () => {
    await app.close();
    const moduleRef = await Test.createTestingModule({
      controllers: [PropertyValuationEstimatorController],
      providers: [{ provide: PropertyValuationEstimatorService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => {
          throw new UnauthorizedException('Sesión requerida');
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/v1/property-valuation-estimator/estimate')
      .send(validBody);

    expect(response.status).toBe(401);
    expect(mockService.estimate).not.toHaveBeenCalled();
  });
});
