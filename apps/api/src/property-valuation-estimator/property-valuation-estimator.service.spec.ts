import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyValuationEstimatorService } from './property-valuation-estimator.service';
import { Property } from '../properties/entities/property.entity';
import { PropertyType } from '../properties/entities/property-type.enum';
import { OperationType } from '../properties/entities/operation-type.enum';
import { EstimateValuationDto } from './dto/estimate-valuation.dto';

describe('PropertyValuationEstimatorService', () => {
  let service: PropertyValuationEstimatorService;
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    getRawMany: jest.Mock;
  };
  let configService: { get: jest.Mock };

  function baseDto(overrides: Partial<EstimateValuationDto> = {}): EstimateValuationDto {
    return Object.assign(new EstimateValuationDto(), {
      type: PropertyType.APARTMENT,
      city: 'San Cristóbal',
      postalCode: '5001',
      surfaceM2: 100,
      ...overrides,
    });
  }

  function comparableRows(pricesPerM2: number[], surfaceM2 = 100) {
    return pricesPerM2.map((pricePerM2) => ({
      price: String(pricePerM2 * surfaceM2),
      surfaceM2: String(surfaceM2),
    }));
  }

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyValuationEstimatorService,
        {
          provide: getRepositoryToken(Property),
          useValue: { createQueryBuilder: jest.fn(() => queryBuilder) },
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(PropertyValuationEstimatorService);
  });

  describe('validacion de zona obligatoria (2.3)', () => {
    it('rechaza la solicitud si no se indica ni ciudad ni codigo postal', async () => {
      await expect(
        service.estimate(baseDto({ city: undefined, postalCode: undefined })),
      ).rejects.toThrow(BadRequestException);
    });

    it('acepta la solicitud si solo se indica ciudad', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2100, 2200]));

      await expect(
        service.estimate(baseDto({ city: 'San Cristóbal', postalCode: undefined })),
      ).resolves.toBeDefined();
    });

    it('acepta la solicitud si solo se indica codigo postal', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2100, 2200]));

      await expect(
        service.estimate(baseDto({ city: undefined, postalCode: '5001' })),
      ).resolves.toBeDefined();
    });
  });

  describe('seleccion de comparables (2.1)', () => {
    it('devuelve un rango de venta disponible cuando hay comparables suficientes (umbral por defecto 3)', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200, 2400]));

      const result = await service.estimate(baseDto());

      expect(result.sale.available).toBe(true);
      if (result.sale.available) {
        expect(result.sale.comparablesCount).toBe(3);
      }
    });

    it('informa de datos insuficientes cuando hay menos comparables que el umbral minimo', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200]));

      const result = await service.estimate(baseDto());

      expect(result.sale).toEqual({ available: false, reason: 'insufficient-data' });
      expect(result.rent).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('respeta un umbral minimo de comparables configurado distinto del valor por defecto', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: unknown) =>
        key === 'VALUATION_ESTIMATOR_MIN_COMPARABLES' ? 5 : defaultValue,
      );
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200, 2400, 2600]));

      const result = await service.estimate(baseDto());

      expect(result.sale).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('calcula venta y alquiler de forma independiente (venta suficiente, alquiler insuficiente)', async () => {
      queryBuilder.getRawMany
        .mockResolvedValueOnce(comparableRows([2000, 2200, 2400])) // sale
        .mockResolvedValueOnce(comparableRows([10, 12])); // rent

      const result = await service.estimate(baseDto());

      expect(result.sale.available).toBe(true);
      expect(result.rent).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('descarta filas con superficie 0 o negativa antes de contar el umbral', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        { price: '200000', surfaceM2: '100' },
        { price: '210000', surfaceM2: '100' },
        { price: '0', surfaceM2: '0' },
      ]);

      const result = await service.estimate(baseDto());

      expect(result.sale).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('filtra por tipo, zona (ciudad + codigo postal normalizados), rango de superficie y operacion', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200, 2400]));

      await service.estimate(baseDto({ surfaceM2: 100 }));

      expect(queryBuilder.where).toHaveBeenCalledWith('property.type = :type', {
        type: PropertyType.APARTMENT,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.operationType = :operationType',
        { operationType: OperationType.SALE },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.surfaceM2 BETWEEN :minSurface AND :maxSurface',
        { minSurface: 75, maxSurface: 125 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'LOWER(TRIM(property.city)) = LOWER(TRIM(:city))',
        { city: 'San Cristóbal' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'TRIM(property.postalCode) = TRIM(:postalCode)',
        { postalCode: '5001' },
      );
    });

    it('filtra por habitaciones +/-1 solo cuando se indican en la solicitud', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200, 2400]));

      await service.estimate(baseDto({ bedrooms: 3 }));

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'ABS(property.bedrooms - :bedrooms) <= :bedroomsTolerance',
        { bedrooms: 3, bedroomsTolerance: 1 },
      );
    });

    it('no filtra por habitaciones cuando no se indican', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200, 2400]));

      await service.estimate(baseDto({ bedrooms: undefined }));

      const bedroomsCalls = queryBuilder.andWhere.mock.calls.filter(([sql]) =>
        String(sql).includes('bedrooms'),
      );
      expect(bedroomsCalls).toHaveLength(0);
    });
  });

  describe('respuesta (2.3)', () => {
    it('incluye siempre el aviso de estimacion orientativa y los criterios usados', async () => {
      queryBuilder.getRawMany.mockResolvedValue(comparableRows([2000, 2200, 2400]));

      const result = await service.estimate(baseDto({ bedrooms: 2, status: 'buen estado' }));

      expect(result.disclaimer).toMatch(/orientativ/i);
      expect(result.criteria).toEqual({
        type: PropertyType.APARTMENT,
        city: 'San Cristóbal',
        postalCode: '5001',
        surfaceM2: 100,
        bedrooms: 2,
        status: 'buen estado',
      });
    });
  });
});
