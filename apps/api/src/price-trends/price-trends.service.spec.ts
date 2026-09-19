import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PriceTrendsService } from './price-trends.service';
import { Property } from '../properties/entities/property.entity';
import { PropertyPriceHistory } from '../properties/entities/property-price-history.entity';

describe('PriceTrendsService', () => {
  let service: PriceTrendsService;
  let propertiesRepository: jest.Mocked<Repository<Property>>;
  let queryBuilder: {
    innerJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    select: jest.Mock;
    addSelect: jest.Mock;
    getRawMany: jest.Mock;
  };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
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
        PriceTrendsService,
        {
          provide: getRepositoryToken(Property),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(PropertyPriceHistory),
          useValue: { createQueryBuilder: jest.fn(() => queryBuilder) },
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(PriceTrendsService);
    propertiesRepository = module.get(getRepositoryToken(Property));
  });

  function rowsForProperties(propertyIds: string[], month = '2026-01-15') {
    return propertyIds.map((propertyId, index) => ({
      propertyId,
      price: '200000',
      surfaceM2: '100',
      recordedAt: new Date(month),
    }));
  }

  describe('getForZone (4.1, 4.2)', () => {
    it('devuelve una serie cuando se alcanza el umbral minimo de propiedades distintas (por defecto 3)', async () => {
      queryBuilder.getRawMany.mockResolvedValue(rowsForProperties(['p1', 'p2', 'p3']));

      const result = await service.getForZone('San Cristóbal', '5001');

      expect(result.available).toBe(true);
      if (!result.available) throw new Error('expected available');
      expect(result.series).toEqual([{ month: '2026-01', averagePricePerM2: 2000 }]);
    });

    it('informa de datos insuficientes por debajo del umbral minimo', async () => {
      queryBuilder.getRawMany.mockResolvedValue(rowsForProperties(['p1', 'p2']));

      const result = await service.getForZone('San Cristóbal', '5001');

      expect(result).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('respeta un umbral minimo configurado distinto del valor por defecto', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: unknown) =>
        key === 'PRICE_TREND_MIN_PROPERTIES' ? 5 : defaultValue,
      );
      queryBuilder.getRawMany.mockResolvedValue(rowsForProperties(['p1', 'p2', 'p3', 'p4']));

      const result = await service.getForZone('San Cristóbal', '5001');

      expect(result).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('cuenta propiedades distintas, no numero de filas de historico (varias ediciones de la misma propiedad cuentan una vez)', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        { propertyId: 'p1', price: '200000', surfaceM2: '100', recordedAt: new Date('2026-01-01') },
        { propertyId: 'p1', price: '210000', surfaceM2: '100', recordedAt: new Date('2026-02-01') },
        { propertyId: 'p2', price: '300000', surfaceM2: '100', recordedAt: new Date('2026-01-01') },
      ]);

      const result = await service.getForZone('San Cristóbal', '5001');

      expect(result).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('descarta puntos sin superficie registrada antes de contar el umbral', async () => {
      queryBuilder.getRawMany.mockResolvedValue([
        { propertyId: 'p1', price: '200000', surfaceM2: '100', recordedAt: new Date('2026-01-01') },
        { propertyId: 'p2', price: '200000', surfaceM2: '100', recordedAt: new Date('2026-01-01') },
        { propertyId: 'p3', price: '200000', surfaceM2: null, recordedAt: new Date('2026-01-01') },
      ]);

      const result = await service.getForZone('San Cristóbal', '5001');

      expect(result).toEqual({ available: false, reason: 'insufficient-data' });
    });

    it('normaliza ciudad y codigo postal en la comparacion SQL (trim + minusculas para ciudad)', async () => {
      queryBuilder.getRawMany.mockResolvedValue(rowsForProperties(['p1', 'p2', 'p3']));

      await service.getForZone(' San Cristóbal ', ' 5001 ');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'LOWER(TRIM(property.city)) = LOWER(TRIM(:city))',
        { city: ' San Cristóbal ' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'TRIM(property.postalCode) = TRIM(:postalCode)',
        { postalCode: ' 5001 ' },
      );
    });
  });

  describe('getForProperty (4.3)', () => {
    it('lanza NotFoundException si la propiedad no existe', async () => {
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getForProperty('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('informa que no hay zona si la propiedad no tiene ciudad ni codigo postal', async () => {
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'no-zone-id',
        city: null,
        postalCode: null,
      });

      const result = await service.getForProperty('no-zone-id');

      expect(result).toEqual({ available: false, reason: 'no-zone' });
      expect(queryBuilder.getRawMany).not.toHaveBeenCalled();
    });

    it('informa que no hay zona si falta solo el codigo postal', async () => {
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'partial-zone-id',
        city: 'San Cristóbal',
        postalCode: null,
      });

      const result = await service.getForProperty('partial-zone-id');

      expect(result).toEqual({ available: false, reason: 'no-zone' });
    });

    it('calcula la tendencia de la zona de la propiedad cuando tiene ciudad y codigo postal', async () => {
      (propertiesRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'with-zone-id',
        city: 'San Cristóbal',
        postalCode: '5001',
      });
      queryBuilder.getRawMany.mockResolvedValue(rowsForProperties(['p1', 'p2', 'p3']));

      const result = await service.getForProperty('with-zone-id');

      expect(result.available).toBe(true);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'LOWER(TRIM(property.city)) = LOWER(TRIM(:city))',
        { city: 'San Cristóbal' },
      );
    });
  });
});
