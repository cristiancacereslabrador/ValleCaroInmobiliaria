import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommuteSearchService } from './commute-search.service';
import { DistanceMatrixError, DistanceMatrixService } from './distance-matrix.service';
import { Property } from '../properties/entities/property.entity';
import { PropertyType } from '../properties/entities/property-type.enum';
import { OperationType } from '../properties/entities/operation-type.enum';
import { GeocodingService } from '../geolocation/geocoding.service';
import { TransportMode } from './transport-mode.enum';

describe('CommuteSearchService', () => {
  let service: CommuteSearchService;
  let geocodingService: { geocodeAddress: jest.Mock };
  let distanceMatrixService: { getDurationsSeconds: jest.Mock };
  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  const DESTINATION_ADDRESS = 'Plaza Libertador, San Cristóbal, Táchira';
  const DESTINATION_COORDS = { latitude: 40.4167754, longitude: -3.7037902 };

  function property(id: string, lat: number, lng: number): Property {
    return {
      id,
      latitude: String(lat),
      longitude: String(lng),
      media: [],
    } as unknown as Property;
  }

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };

    geocodingService = { geocodeAddress: jest.fn().mockResolvedValue(DESTINATION_COORDS) };
    distanceMatrixService = { getDurationsSeconds: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommuteSearchService,
        {
          provide: getRepositoryToken(Property),
          useValue: { createQueryBuilder: jest.fn(() => queryBuilder) },
        },
        { provide: GeocodingService, useValue: geocodingService },
        { provide: DistanceMatrixService, useValue: distanceMatrixService },
      ],
    }).compile();

    service = module.get(CommuteSearchService);
    void module.get<Repository<Property>>(getRepositoryToken(Property));
  });

  describe('Scenario: Búsqueda con parámetros válidos', () => {
    it('devuelve solo las propiedades cuyo trayecto estimado no supera el tiempo maximo', async () => {
      queryBuilder.getMany.mockResolvedValue([
        property('near', 40.417, -3.704),
        property('far-but-in-box', 40.418, -3.705),
      ]);
      distanceMatrixService.getDurationsSeconds.mockResolvedValue([300, 1800]);

      const result = await service.search({
        destinationAddress: DESTINATION_ADDRESS,
        transportMode: TransportMode.WALKING,
        maxDurationMinutes: 10,
      } as any);

      expect(result).toEqual({
        available: true,
        properties: [expect.objectContaining({ id: 'near', commuteDurationSeconds: 300 })],
      });
    });

    it('resuelve el destino por coordenadas explicitas sin geocodificar', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.search({
        destinationLat: 40.4167754,
        destinationLng: -3.7037902,
        transportMode: TransportMode.DRIVING,
        maxDurationMinutes: 15,
      } as any);

      expect(geocodingService.geocodeAddress).not.toHaveBeenCalled();
    });
  });

  describe('Scenario: Destino no resoluble', () => {
    it('rechaza la busqueda cuando la direccion no puede geocodificarse', async () => {
      geocodingService.geocodeAddress.mockResolvedValue(null);

      await expect(
        service.search({
          destinationAddress: 'direccion inexistente xyz',
          transportMode: TransportMode.DRIVING,
          maxDurationMinutes: 20,
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(distanceMatrixService.getDurationsSeconds).not.toHaveBeenCalled();
    });

    it('rechaza la busqueda cuando no se indica ningun destino', async () => {
      await expect(
        service.search({
          transportMode: TransportMode.DRIVING,
          maxDurationMinutes: 20,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Scenario: Sin propiedades dentro del tiempo indicado', () => {
    it('devuelve una lista vacia (sin error) cuando ninguna propiedad esta en el pre-filtro', async () => {
      queryBuilder.getMany.mockResolvedValue([property('lejos', 41.5, -4.5)]);

      const result = await service.search({
        destinationAddress: DESTINATION_ADDRESS,
        transportMode: TransportMode.WALKING,
        maxDurationMinutes: 5,
      } as any);

      expect(result).toEqual({ available: true, properties: [] });
      expect(distanceMatrixService.getDurationsSeconds).not.toHaveBeenCalled();
    });

    it('devuelve una lista vacia cuando Distance Matrix no encuentra ruta dentro del tiempo para ninguna candidata', async () => {
      queryBuilder.getMany.mockResolvedValue([property('cerca', 40.417, -3.704)]);
      distanceMatrixService.getDurationsSeconds.mockResolvedValue([9999]);

      const result = await service.search({
        destinationAddress: DESTINATION_ADDRESS,
        transportMode: TransportMode.WALKING,
        maxDurationMinutes: 5,
      } as any);

      expect(result).toEqual({ available: true, properties: [] });
    });
  });

  describe('Scenario: Combinación con otros filtros del catálogo', () => {
    it('aplica los filtros de catalogo indicados ademas del tiempo de trayecto', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.search({
        destinationAddress: DESTINATION_ADDRESS,
        transportMode: TransportMode.DRIVING,
        maxDurationMinutes: 30,
        type: PropertyType.APARTMENT,
        operationType: OperationType.RENT,
        minPrice: 500,
        maxPrice: 1500,
        hasElevator: true,
      } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.type = :type', {
        type: PropertyType.APARTMENT,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'property.operationType = :operationType',
        { operationType: OperationType.RENT },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.price >= :minPrice', {
        minPrice: 500,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.price <= :maxPrice', {
        maxPrice: 1500,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.hasElevator = :hasElevator', {
        hasElevator: true,
      });
    });

    it('siempre exige coordenadas no nulas, con independencia de otros filtros', async () => {
      queryBuilder.getMany.mockResolvedValue([]);

      await service.search({
        destinationAddress: DESTINATION_ADDRESS,
        transportMode: TransportMode.DRIVING,
        maxDurationMinutes: 30,
      } as any);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.latitude IS NOT NULL');
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('property.longitude IS NOT NULL');
    });
  });

  describe('Requirement: Manejo de error del servicio de cálculo de trayectos', () => {
    it('Scenario "Servicio no disponible": informa sin lanzar cuando Distance Matrix falla', async () => {
      queryBuilder.getMany.mockResolvedValue([property('cerca', 40.417, -3.704)]);
      distanceMatrixService.getDurationsSeconds.mockRejectedValue(
        new DistanceMatrixError('network error'),
      );

      const result = await service.search({
        destinationAddress: DESTINATION_ADDRESS,
        transportMode: TransportMode.DRIVING,
        maxDurationMinutes: 30,
      } as any);

      expect(result).toEqual({ available: false, reason: 'service-unavailable' });
    });

    it('no llama a Distance Matrix (ni falla) cuando el destino no es valido, permitiendo distinguir ambos errores', async () => {
      geocodingService.geocodeAddress.mockResolvedValue(null);

      await expect(
        service.search({
          destinationAddress: 'xyz',
          transportMode: TransportMode.DRIVING,
          maxDurationMinutes: 30,
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(distanceMatrixService.getDurationsSeconds).not.toHaveBeenCalled();
    });
  });
});
