import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertiesService } from './properties.service';
import { Property } from './entities/property.entity';
import { PropertyPriceHistory } from './entities/property-price-history.entity';
import { PropertyType } from './entities/property-type.enum';
import { OperationType } from './entities/operation-type.enum';
import { GeocodingService } from '../geolocation/geocoding.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PropertiesService', () => {
  let service: PropertiesService;
  let repository: jest.Mocked<Repository<Property>>;
  let priceHistoryRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let geocodingService: { geocodeAddress: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    priceHistoryRepository = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'history-generated-id', ...data })),
      find: jest.fn().mockResolvedValue([]),
    };

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        {
          provide: getRepositoryToken(Property),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'generated-id', ...data })),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        {
          provide: getRepositoryToken(PropertyPriceHistory),
          useValue: priceHistoryRepository,
        },
        {
          provide: GeocodingService,
          useValue: { geocodeAddress: jest.fn() },
        },
        // saved-search-alerts: PropertiesService ahora emite eventos internos
        // (`property.created`/`property.priceChanged`); se mockea para no
        // depender de EventEmitterModule en este test unitario.
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    service = module.get(PropertiesService);
    repository = module.get(getRepositoryToken(Property));
    geocodingService = module.get(GeocodingService);
  });

  describe('create', () => {
    it('crea una propiedad con los datos obligatorios', async () => {
      const dto = {
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        price: 150000,
      };

      const result = await service.create(dto as any);

      expect(result).toMatchObject({ price: '150000', type: PropertyType.APARTMENT });
      expect(repository.save).toHaveBeenCalled();
    });

    it('geocodifica automaticamente cuando hay direccion sin coordenadas explicitas', async () => {
      geocodingService.geocodeAddress.mockResolvedValue({
        latitude: 7.7497768,
        longitude: -72.2293373,
      });

      const dto = {
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        price: 150000,
        address: 'Plaza Libertador, San Cristóbal, Táchira',
      };

      const result = await service.create(dto as any);

      expect(geocodingService.geocodeAddress).toHaveBeenCalledWith(
        'Plaza Libertador, San Cristóbal, Táchira',
      );
      expect(result.latitude).toBe('7.7497768');
      expect(result.longitude).toBe('-72.2293373');
    });

    it('guarda la propiedad sin coordenadas si la direccion no es geocodificable (no bloquea la creacion)', async () => {
      geocodingService.geocodeAddress.mockResolvedValue(null);

      const dto = {
        type: PropertyType.LAND,
        operationType: OperationType.SALE,
        price: 50000,
        address: 'direccion inexistente e imposible de geocodificar',
      };

      const result = await service.create(dto as any);

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
      expect(repository.save).toHaveBeenCalled();
    });

    it('crea una propiedad sin indicar ascensor/reforma/procedencia bancaria (quedan como no indicados - 1.2)', async () => {
      const dto = {
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        price: 150000,
      };

      const result = await service.create(dto as any);

      expect(result.hasElevator).toBeUndefined();
      expect(result.needsRenovation).toBeUndefined();
    });

    it('crea una propiedad con ascensor y reforma indicados explicitamente (1.2)', async () => {
      const dto = {
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        price: 150000,
        hasElevator: true,
        needsRenovation: false,
      };

      const result = await service.create(dto as any);

      expect(result.hasElevator).toBe(true);
      expect(result.needsRenovation).toBe(false);
    });

    it('usa las coordenadas explicitas sin llamar al geocodificador si se envian', async () => {
      const dto = {
        type: PropertyType.HOUSE,
        operationType: OperationType.RENT,
        price: 900,
        address: 'Calle Falsa 123',
        latitude: 10,
        longitude: 20,
      };

      const result = await service.create(dto as any);

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
      expect(result.latitude).toBe('10');
      expect(result.longitude).toBe('20');
    });

    it('emite el evento interno "property.created" al crear una propiedad (saved-search-alerts 3.1)', async () => {
      const dto = {
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        price: 150000,
      };

      const result = await service.create(dto as any);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'property.created',
        expect.objectContaining({ property: expect.objectContaining({ id: result.id }) }),
      );
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si el id no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('devuelve la propiedad cuando existe (con coverPhotoUrl calculado)', async () => {
      const property = {
        id: 'existing-id',
        media: [],
        listingStatus: 'published',
      } as unknown as Property;
      (repository.findOne as jest.Mock).mockResolvedValue(property);

      await expect(service.findOne('existing-id')).resolves.toEqual({
        ...property,
        coverPhotoUrl: null,
      });
    });
  });

  describe('update', () => {
    it('lanza NotFoundException al editar un id inexistente', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update('missing-id', { price: 1000 } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('actualiza una propiedad existente', async () => {
      const existing = {
        id: 'existing-id',
        price: '100000',
        address: null,
        latitude: null,
        longitude: null,
      } as unknown as Property;
      (repository.findOne as jest.Mock).mockResolvedValue(existing);

      const result = await service.update('existing-id', { price: 250000 } as any);

      expect(result.price).toBe('250000');
      expect(repository.save).toHaveBeenCalled();
    });

    describe('historico de precio (2.1)', () => {
      it('añade un registro al historico con el precio anterior y la fecha del cambio al editar el precio', async () => {
        const existing = {
          id: 'existing-id',
          price: '100000',
          address: null,
          latitude: null,
          longitude: null,
        } as unknown as Property;
        (repository.findOne as jest.Mock).mockResolvedValue(existing);

        await service.update('existing-id', { price: 250000 } as any);

        expect(priceHistoryRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            propertyId: 'existing-id',
            price: '100000',
            recordedAt: expect.any(Date),
          }),
        );
      });

      it('no añade ningun registro al historico si la edicion no cambia el precio', async () => {
        const existing = {
          id: 'existing-id',
          price: '100000',
          address: null,
          latitude: null,
          longitude: null,
        } as unknown as Property;
        (repository.findOne as jest.Mock).mockResolvedValue(existing);

        await service.update('existing-id', { status: 'buen estado' } as any);

        expect(priceHistoryRepository.save).not.toHaveBeenCalled();
      });

      it('no añade ningun registro si se envia explicitamente el mismo precio', async () => {
        const existing = {
          id: 'existing-id',
          price: '100000',
          address: null,
          latitude: null,
          longitude: null,
        } as unknown as Property;
        (repository.findOne as jest.Mock).mockResolvedValue(existing);

        await service.update('existing-id', { price: 100000 } as any);

        expect(priceHistoryRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('evento interno "property.priceChanged" (saved-search-alerts 4.1)', () => {
      it('se emite con el precio anterior y el nuevo cuando la edicion cambia el precio', async () => {
        const existing = {
          id: 'existing-id',
          price: '100000',
          address: null,
          latitude: null,
          longitude: null,
        } as unknown as Property;
        (repository.findOne as jest.Mock).mockResolvedValue(existing);

        await service.update('existing-id', { price: 250000 } as any);

        expect(eventEmitter.emit).toHaveBeenCalledWith(
          'property.priceChanged',
          expect.objectContaining({
            previousPrice: '100000',
            newPrice: '250000',
            property: expect.objectContaining({ id: 'existing-id' }),
          }),
        );
      });

      it('no se emite si la edicion no cambia el precio', async () => {
        const existing = {
          id: 'existing-id',
          price: '100000',
          address: null,
          latitude: null,
          longitude: null,
        } as unknown as Property;
        (repository.findOne as jest.Mock).mockResolvedValue(existing);

        await service.update('existing-id', { status: 'buen estado' } as any);

        expect(eventEmitter.emit).not.toHaveBeenCalledWith('property.priceChanged', expect.anything());
      });
    });
  });

  describe('getPriceHistory (2.2)', () => {
    it('lanza NotFoundException si la propiedad no existe', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.getPriceHistory('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('devuelve el historico de precio en orden cronologico', async () => {
      (repository.findOne as jest.Mock).mockResolvedValue({ id: 'existing-id', media: [] });
      const history = [
        { id: 'h1', propertyId: 'existing-id', price: '100000', recordedAt: new Date('2026-01-01') },
        { id: 'h2', propertyId: 'existing-id', price: '120000', recordedAt: new Date('2026-02-01') },
      ];
      priceHistoryRepository.find.mockResolvedValue(history);

      const result = await service.getPriceHistory('existing-id');

      expect(priceHistoryRepository.find).toHaveBeenCalledWith({
        where: { propertyId: 'existing-id' },
        order: { recordedAt: 'ASC' },
      });
      expect(result).toEqual(history);
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException al eliminar un id inexistente', async () => {
      (repository.delete as jest.Mock).mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('elimina una propiedad existente', async () => {
      (repository.delete as jest.Mock).mockResolvedValue({ affected: 1, raw: {} });

      await expect(service.remove('existing-id')).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('aplica el filtro por tipo de vivienda y tipo de operacion', async () => {
      await service.findAll({
        type: PropertyType.QUINTA,
        operationType: OperationType.RENT,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.type = :type', {
        type: PropertyType.QUINTA,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.operationType = :operationType',
        { operationType: OperationType.RENT },
      );
    });

    it('aplica el filtro por rango de precio', async () => {
      await service.findAll({ minPrice: 100000, maxPrice: 300000 });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.price >= :minPrice', {
        minPrice: 100000,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.price <= :maxPrice', {
        maxPrice: 300000,
      });
    });

    it('aplica el filtro por habitaciones mínimas', async () => {
      await service.findAll({ minBedrooms: 3 });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.bedrooms >= :minBedrooms', {
        minBedrooms: 3,
      });
    });

    it('filtra el listado público a propiedades publicadas', async () => {
      await service.findAll({});

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.listingStatus = :publishedStatus', {
        publishedStatus: 'published',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
    });

    it('aplica el filtro por ascensor (2.1)', async () => {
      await service.findAll({ hasElevator: true } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.hasElevator = :hasElevator', {
        hasElevator: true,
      });
    });

    it('aplica el filtro por "sin ascensor" (hasElevator=false) (2.1)', async () => {
      await service.findAll({ hasElevator: false } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.hasElevator = :hasElevator', {
        hasElevator: false,
      });
    });

    it('aplica el filtro por planta baja (2.1)', async () => {
      await service.findAll({ groundFloor: true } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.floor = :groundFloor', {
        groundFloor: 0,
      });
    });

    it('aplica el filtro por "no es planta baja" (groundFloor=false) (2.1)', async () => {
      await service.findAll({ groundFloor: false } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.floor <> :groundFloor', {
        groundFloor: 0,
      });
    });

    it('aplica el filtro por necesidad de reforma (2.1)', async () => {
      await service.findAll({ needsRenovation: true } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.needsRenovation = :needsRenovation',
        { needsRenovation: true },
      );
    });

    it('combina los filtros nuevos con tipo, operacion y rango de precio (2.2)', async () => {
      await service.findAll({
        type: PropertyType.APARTMENT,
        operationType: OperationType.SALE,
        minPrice: 100000,
        maxPrice: 300000,
        hasElevator: true,
        groundFloor: false,
        needsRenovation: false,
      } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.listingStatus = :publishedStatus', {
        publishedStatus: 'published',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.type = :type', {
        type: PropertyType.APARTMENT,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.operationType = :operationType',
        { operationType: OperationType.SALE },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.price >= :minPrice', {
        minPrice: 100000,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.price <= :maxPrice', {
        maxPrice: 300000,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.hasElevator = :hasElevator', {
        hasElevator: true,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.floor <> :groundFloor', {
        groundFloor: 0,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.needsRenovation = :needsRenovation',
        { needsRenovation: false },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(8);
    });

    describe('busqueda por area geografica (3.2, 3.3)', () => {
      const SQUARE_AREA = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 },
      ];

      it('devuelve solo las propiedades geolocalizadas dentro del poligono', async () => {
        queryBuilder.getMany.mockResolvedValue([
          { id: 'inside', latitude: '5', longitude: '5', media: [] },
          { id: 'outside', latitude: '50', longitude: '50', media: [] },
        ] as any);

        const result = await service.findAll({ area: SQUARE_AREA } as any);

        expect(result.map((p) => p.id)).toEqual(['inside']);
      });

      it('devuelve una lista vacia si el area no contiene ninguna propiedad geolocalizada', async () => {
        queryBuilder.getMany.mockResolvedValue([
          { id: 'outside-1', latitude: '50', longitude: '50', media: [] },
          { id: 'outside-2', latitude: '-50', longitude: '-50', media: [] },
        ] as any);

        const result = await service.findAll({ area: SQUARE_AREA } as any);

        expect(result).toEqual([]);
      });

      it('exige coordenadas no nulas al buscar por area', async () => {
        queryBuilder.getMany.mockResolvedValue([]);

        await service.findAll({ area: SQUARE_AREA } as any);

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.latitude IS NOT NULL');
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.longitude IS NOT NULL');
      });

      it('combina la busqueda por area con el resto de filtros del catalogo (3.3)', async () => {
        queryBuilder.getMany.mockResolvedValue([
          { id: 'match', latitude: '5', longitude: '5', media: [] },
        ] as any);

        const result = await service.findAll({
          type: PropertyType.APARTMENT,
          operationType: OperationType.SALE,
          minPrice: 100000,
          maxPrice: 300000,
          hasElevator: true,
          area: SQUARE_AREA,
        } as any);

        expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.type = :type', {
          type: PropertyType.APARTMENT,
        });
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.hasElevator = :hasElevator', {
          hasElevator: true,
        });
        expect(result.map((p) => p.id)).toEqual(['match']);
      });

      it('no aplica el filtro de area cuando no se indica poligono', async () => {
        await service.findAll({});

        expect(queryBuilder.andWhere).not.toHaveBeenCalledWith('property.latitude IS NOT NULL');
      });
    });
  });
});
