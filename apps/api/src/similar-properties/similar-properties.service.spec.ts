import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SimilarPropertiesService } from './similar-properties.service';
import { Property } from '../properties/entities/property.entity';
import { PropertyType } from '../properties/entities/property-type.enum';
import { OperationType } from '../properties/entities/operation-type.enum';

describe('SimilarPropertiesService', () => {
  let service: SimilarPropertiesService;
  let propertiesRepository: jest.Mocked<Repository<Property>>;
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    take: jest.Mock;
    getMany: jest.Mock;
  };
  let configService: { get: jest.Mock };

  function buildProperty(overrides: Partial<Property> = {}): Property {
    return {
      id: 'reference-id',
      type: PropertyType.APARTMENT,
      operationType: OperationType.SALE,
      price: '150000',
      surfaceM2: '100',
      bedrooms: 3,
      bathrooms: 1,
      floor: 2,
      constructionYear: 2000,
      status: null,
      address: null,
      latitude: null,
      longitude: null,
      hasElevator: null,
      needsRenovation: null,
      city: null,
      postalCode: null,
      media: [],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...overrides,
    } as Property;
  }

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => defaultValue),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimilarPropertiesService,
        {
          provide: getRepositoryToken(Property),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(SimilarPropertiesService);
    propertiesRepository = module.get(getRepositoryToken(Property));
  });

  describe('getSimilar (1.1)', () => {
    it('lanza NotFoundException si la propiedad de referencia no existe', async () => {
      propertiesRepository.findOne.mockResolvedValue(null);

      await expect(service.getSimilar('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('devuelve hasta el maximo configurable (por defecto 6) de propiedades similares, sin incluir la propia', async () => {
      const reference = buildProperty();
      propertiesRepository.findOne.mockResolvedValue(reference);

      const candidates = Array.from({ length: 10 }, (_, index) =>
        buildProperty({ id: `similar-${index}`, media: [] }),
      );
      queryBuilder.getMany.mockResolvedValue(candidates);

      const result = await service.getSimilar('reference-id');

      expect(result).toHaveLength(6);
      expect(result.every((property) => property.id !== 'reference-id')).toBe(true);
      expect(queryBuilder.where).toHaveBeenCalledWith('property.id != :id', { id: 'reference-id' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.type = :type', {
        type: PropertyType.APARTMENT,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.operationType = :operationType', {
        operationType: OperationType.SALE,
      });
    });

    it('devuelve una lista vacia cuando no hay propiedades similares, sin considerarlo un error', async () => {
      propertiesRepository.findOne.mockResolvedValue(buildProperty());
      queryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getSimilar('reference-id');

      expect(result).toEqual([]);
    });

    it('filtra por superficie dentro de +/-20% y habitaciones dentro de +/-1 de la referencia', async () => {
      propertiesRepository.findOne.mockResolvedValue(buildProperty({ surfaceM2: '100', bedrooms: 3 }));
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getSimilar('reference-id');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.surfaceM2 BETWEEN :minSurface AND :maxSurface',
        { minSurface: 80, maxSurface: 120 },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.bedrooms BETWEEN :minRooms AND :maxRooms', {
        minRooms: 2,
        maxRooms: 4,
      });
    });

    it('omite el filtro de superficie/habitaciones cuando la referencia no los tiene registrados', async () => {
      propertiesRepository.findOne.mockResolvedValue(
        buildProperty({ surfaceM2: null, bedrooms: null }),
      );
      queryBuilder.getMany.mockResolvedValue([]);

      await service.getSimilar('reference-id');

      const calls = queryBuilder.andWhere.mock.calls.map((call) => call[0]);
      expect(calls).not.toContain('property.surfaceM2 BETWEEN :minSurface AND :maxSurface');
      expect(calls).not.toContain('property.bedrooms BETWEEN :minRooms AND :maxRooms');
    });

    it('incluye coverPhotoUrl a partir de la portada de cada candidata', async () => {
      propertiesRepository.findOne.mockResolvedValue(buildProperty());
      queryBuilder.getMany.mockResolvedValue([
        buildProperty({
          id: 'similar-1',
          media: [
            {
              id: 'media-1',
              propertyId: 'similar-1',
              type: 'photo' as any,
              url: '/media/properties/similar-1/cover.jpg',
              isCover: true,
              position: 0,
              createdAt: new Date('2026-01-01'),
            } as any,
          ],
        }),
      ]);

      const result = await service.getSimilar('reference-id');

      expect(result[0].coverPhotoUrl).toBe('/media/properties/similar-1/cover.jpg');
    });
  });

  describe('orden por cercania geografica (1.2)', () => {
    it('prioriza las candidatas mas cercanas cuando referencia y candidatas tienen coordenadas', async () => {
      propertiesRepository.findOne.mockResolvedValue(
        buildProperty({ latitude: '40.4168000', longitude: '-3.7038000' }),
      );

      const far = buildProperty({ id: 'far', latitude: '41.3851000', longitude: '2.1734000' });
      const near = buildProperty({ id: 'near', latitude: '40.4200000', longitude: '-3.7000000' });
      queryBuilder.getMany.mockResolvedValue([far, near]);

      const result = await service.getSimilar('reference-id');

      expect(result.map((property) => property.id)).toEqual(['near', 'far']);
    });

    it('mantiene al final las candidatas sin coordenadas cuando la referencia si tiene', async () => {
      propertiesRepository.findOne.mockResolvedValue(
        buildProperty({ latitude: '40.4168000', longitude: '-3.7038000' }),
      );

      const withCoords = buildProperty({
        id: 'with-coords',
        latitude: '40.4200000',
        longitude: '-3.7000000',
      });
      const withoutCoords = buildProperty({ id: 'without-coords', latitude: null, longitude: null });
      queryBuilder.getMany.mockResolvedValue([withoutCoords, withCoords]);

      const result = await service.getSimilar('reference-id');

      expect(result.map((property) => property.id)).toEqual(['with-coords', 'without-coords']);
    });

    it('no reordena por distancia cuando la propiedad de referencia no tiene coordenadas', async () => {
      propertiesRepository.findOne.mockResolvedValue(buildProperty({ latitude: null, longitude: null }));

      const first = buildProperty({ id: 'first', latitude: '41.0', longitude: '2.0' });
      const second = buildProperty({ id: 'second', latitude: '40.0', longitude: '-3.0' });
      queryBuilder.getMany.mockResolvedValue([first, second]);

      const result = await service.getSimilar('reference-id');

      expect(result.map((property) => property.id)).toEqual(['first', 'second']);
    });
  });

  describe('limite configurable (1.3)', () => {
    it('usa SIMILAR_PROPERTIES_LIMIT del ConfigService como maximo de resultados', async () => {
      configService.get.mockImplementation((key: string, defaultValue?: unknown) =>
        key === 'SIMILAR_PROPERTIES_LIMIT' ? 2 : defaultValue,
      );
      propertiesRepository.findOne.mockResolvedValue(buildProperty());
      queryBuilder.getMany.mockResolvedValue([
        buildProperty({ id: 'a' }),
        buildProperty({ id: 'b' }),
        buildProperty({ id: 'c' }),
      ]);

      const result = await service.getSimilar('reference-id');

      expect(result).toHaveLength(2);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });
  });
});
