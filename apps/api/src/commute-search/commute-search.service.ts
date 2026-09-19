import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { pickCoverPhotoUrl } from '../property-media/cover-photo.util';
import { GeocodingService } from '../geolocation/geocoding.service';
import type { GeoPoint } from '../geolocation/point-in-polygon.util';
import { DistanceMatrixError, DistanceMatrixService } from './distance-matrix.service';
import { getBoundingBox, getConservativeRadiusMeters, isWithinBoundingBox } from './bounding-box.util';
import { QueryCommuteSearchDto } from './dto/query-commute-search.dto';
import { CommuteSearchResult, PropertyWithCommute } from './commute-search-result.interface';
import { ListingStatus } from '../properties/entities/listing-status.enum';

const SECONDS_PER_MINUTE = 60;

/**
 * commute-search spec, Requirement "Búsqueda por tiempo máximo de trayecto a
 * un destino" y "Manejo de error del servicio de cálculo de trayectos".
 *
 * Modulo aislado (design.md - Decision 1 y 2): inyecta el repositorio de
 * `Property` directamente (mismo patron que nearby-services), sin depender
 * de PropertiesService/PropertiesController.
 */
@Injectable()
export class CommuteSearchService {
  private readonly logger = new Logger(CommuteSearchService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    private readonly geocodingService: GeocodingService,
    private readonly distanceMatrixService: DistanceMatrixService,
  ) {}

  /**
   * Scenario "Búsqueda con parámetros válidos", "Sin propiedades dentro del
   * tiempo indicado" y "Combinación con otros filtros del catálogo".
   * Lanza BadRequestException para "Destino no resoluble" (400: es un
   * problema de los parametros de entrada, no del servicio externo).
   */
  async search(query: QueryCommuteSearchDto): Promise<CommuteSearchResult> {
    const destination = await this.resolveDestination(query);

    const candidates = await this.findCatalogCandidates(query);

    const radiusMeters = getConservativeRadiusMeters(query.maxDurationMinutes, query.transportMode);
    const box = getBoundingBox(destination, radiusMeters);

    const withinBox = candidates.filter((property) =>
      isWithinBoundingBox(toGeoPoint(property), box),
    );

    if (withinBox.length === 0) {
      return { available: true, properties: [] };
    }

    let durationsSeconds: Array<number | null>;
    try {
      durationsSeconds = await this.distanceMatrixService.getDurationsSeconds(
        withinBox.map(toGeoPoint),
        destination,
        query.transportMode,
      );
    } catch (error) {
      // Requirement "Manejo de error del servicio de calculo de trayectos",
      // Scenario "Servicio no disponible": se informa sin lanzar un error
      // HTTP generico, para no romper el resto de la busqueda del catalogo.
      if (error instanceof DistanceMatrixError) {
        this.logger.warn(`Distance Matrix no disponible: ${error.message}`);
        return { available: false, reason: 'service-unavailable' };
      }
      throw error;
    }

    const maxDurationSeconds = query.maxDurationMinutes * SECONDS_PER_MINUTE;

    const properties: PropertyWithCommute[] = withinBox
      .map((property, index) => ({ property, durationSeconds: durationsSeconds[index] }))
      .filter(
        (entry): entry is { property: Property; durationSeconds: number } =>
          entry.durationSeconds !== null && entry.durationSeconds <= maxDurationSeconds,
      )
      .map(({ property, durationSeconds }) => ({
        ...property,
        coverPhotoUrl: pickCoverPhotoUrl(property.media ?? []),
        commuteDurationSeconds: durationSeconds,
      }));

    return { available: true, properties };
  }

  /**
   * Resuelve el destino a coordenadas: usa `destinationLat`/`destinationLng`
   * si llegan explicitas, o geocodifica `destinationAddress` en caso
   * contrario. Scenario "Destino no resoluble": tanto la ausencia de
   * cualquiera de las dos formas como un fallo de geocodificacion se tratan
   * como el mismo error de validacion (400).
   */
  private async resolveDestination(query: QueryCommuteSearchDto): Promise<GeoPoint> {
    if (query.destinationLat !== undefined && query.destinationLng !== undefined) {
      return { lat: query.destinationLat, lng: query.destinationLng };
    }

    if (!query.destinationAddress) {
      throw new BadRequestException(
        'Debe indicarse un destino, como dirección (destinationAddress) o coordenadas (destinationLat/destinationLng)',
      );
    }

    const coordinates = await this.geocodingService.geocodeAddress(query.destinationAddress);

    if (!coordinates) {
      throw new BadRequestException(
        `El destino indicado ("${query.destinationAddress}") no es válido`,
      );
    }

    return { lat: coordinates.latitude, lng: coordinates.longitude };
  }

  /**
   * Replica el subconjunto de filtros de catalogo de QueryPropertiesDto
   * necesario para el escenario "Combinación con otros filtros del
   * catálogo", consultando el repositorio de `Property` directamente (sin
   * tocar PropertiesService, ver aislamiento del modulo). Solo se
   * consideran propiedades geolocalizadas (requisito para poder calcular
   * cualquier trayecto).
   */
  private async findCatalogCandidates(query: QueryCommuteSearchDto): Promise<Property[]> {
    const qb = this.propertiesRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.media', 'media')
      .andWhere('property.listingStatus = :publishedStatus', {
        publishedStatus: ListingStatus.PUBLISHED,
      })
      .andWhere('property.latitude IS NOT NULL')
      .andWhere('property.longitude IS NOT NULL');

    if (query.type) {
      qb.andWhere('property.type = :type', { type: query.type });
    }

    if (query.operationType) {
      qb.andWhere('property.operationType = :operationType', {
        operationType: query.operationType,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('property.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('property.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.hasElevator !== undefined) {
      qb.andWhere('property.hasElevator = :hasElevator', { hasElevator: query.hasElevator });
    }

    if (query.groundFloor !== undefined) {
      qb.andWhere(
        query.groundFloor ? 'property.floor = :groundFloor' : 'property.floor <> :groundFloor',
        { groundFloor: 0 },
      );
    }

    if (query.needsRenovation !== undefined) {
      qb.andWhere('property.needsRenovation = :needsRenovation', {
        needsRenovation: query.needsRenovation,
      });
    }

    return qb.getMany();
  }
}

function toGeoPoint(property: Property): GeoPoint {
  return { lat: Number(property.latitude), lng: Number(property.longitude) };
}
