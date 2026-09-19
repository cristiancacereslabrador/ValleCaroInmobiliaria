import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import type { PropertyWithCover } from '../properties/properties.service';
import { pickCoverPhotoUrl } from '../property-media/cover-photo.util';
import { haversineDistanceMeters } from '../geolocation/haversine.util';

const DEFAULT_LIMIT = 6;

/**
 * design.md - Decision 1: "limita a un multiplo del maximo deseado (p. ej.
 * 30 candidatas)". Con el `DEFAULT_LIMIT` de 6 esto da exactamente 30; se
 * mantiene como multiplo fijo en vez de configurable porque no es un valor
 * mencionado en la spec (a diferencia del maximo de resultados de la tarea
 * 1.3), solo una decision de implementacion del propio calculo.
 */
const CANDIDATE_POOL_MULTIPLIER = 5;

const SURFACE_TOLERANCE_RATIO = 0.2;
const ROOMS_TOLERANCE = 1;

/**
 * similar-properties spec, Requirement "Calculo de propiedades similares".
 * Modulo autocontenido de solo lectura sobre `Property` (design.md -
 * Context): inyecta su propio repositorio en vez de depender de
 * `PropertiesModule`/`PropertiesService`, igual que `nearby-services` y
 * `price-trends`.
 */
@Injectable()
export class SimilarPropertiesService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Devuelve hasta `SIMILAR_PROPERTIES_LIMIT` (por defecto 6) propiedades
   * similares a la propiedad `id`: mismo `type`/`operationType`, superficie
   * dentro de +/-20% y habitaciones (`bedrooms`) dentro de +/-1, excluyendo
   * siempre la propia propiedad (tasks.md 1.1).
   *
   * Nota de alcance: la entidad `Property` de este proyecto no modela un
   * estado "activo/inactivo" ni borrado logico (`remove()` en
   * `properties.service.ts` es un DELETE fisico) - no existe tal columna en
   * ningun otro modulo del backend. Por tanto "propiedades activas" (spec)
   * se interpreta como "toda propiedad existente en el catalogo" y el unico
   * filtro de exclusion aplicado es el de la propia propiedad de referencia.
   *
   * Si la propiedad de referencia no tiene superficie u habitaciones
   * registradas (campos nullable en la entidad), ese criterio de similitud
   * en concreto se omite en vez de excluir a todas las candidatas (no hay
   * un rango +/-20% de "null" que aplicar) - el resto de criterios se
   * mantienen.
   */
  async getSimilar(id: string): Promise<PropertyWithCover[]> {
    const reference = await this.propertiesRepository.findOne({ where: { id } });

    if (!reference) {
      throw new NotFoundException(`Property with id "${id}" not found`);
    }

    const limit = this.configService.get<number>('SIMILAR_PROPERTIES_LIMIT', DEFAULT_LIMIT);
    const candidatePoolSize = limit * CANDIDATE_POOL_MULTIPLIER;

    const qb = this.propertiesRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.media', 'media')
      .where('property.id != :id', { id })
      .andWhere('property.listingStatus = :publishedStatus', { publishedStatus: 'published' })
      .andWhere('property.type = :type', { type: reference.type })
      .andWhere('property.operationType = :operationType', {
        operationType: reference.operationType,
      });

    if (reference.surfaceM2 !== null) {
      const surface = Number(reference.surfaceM2);
      qb.andWhere('property.surfaceM2 BETWEEN :minSurface AND :maxSurface', {
        minSurface: surface * (1 - SURFACE_TOLERANCE_RATIO),
        maxSurface: surface * (1 + SURFACE_TOLERANCE_RATIO),
      });
    }

    if (reference.bedrooms !== null) {
      qb.andWhere('property.bedrooms BETWEEN :minRooms AND :maxRooms', {
        minRooms: reference.bedrooms - ROOMS_TOLERANCE,
        maxRooms: reference.bedrooms + ROOMS_TOLERANCE,
      });
    }

    qb.orderBy('property.createdAt', 'DESC').take(candidatePoolSize);

    const candidates = await qb.getMany();

    const ordered = this.orderByProximity(reference, candidates).slice(0, limit);

    return ordered.map((property) => ({
      ...property,
      coverPhotoUrl: pickCoverPhotoUrl(property.media ?? []),
    }));
  }

  /**
   * similar-properties spec, Scenario "Priorizar cercania geografica cuando
   * ambas estan geolocalizadas" (tasks.md 1.2): si la propiedad de
   * referencia tiene coordenadas, las candidatas que tambien las tienen se
   * ordenan por distancia ascendente y van primero; las candidatas sin
   * coordenadas se mantienen al final (en el orden ya devuelto por SQL) en
   * vez de descartarse, porque la spec no pide excluirlas, solo priorizar a
   * las mas cercanas. Si la referencia no tiene coordenadas, no hay base
   * para calcular distancia y se conserva el orden de la consulta.
   */
  private orderByProximity(reference: Property, candidates: Property[]): Property[] {
    if (reference.latitude === null || reference.longitude === null) {
      return candidates;
    }

    const referencePoint = {
      lat: Number(reference.latitude),
      lng: Number(reference.longitude),
    };

    const withDistance: Array<{ property: Property; distanceMeters: number }> = [];
    const withoutCoordinates: Property[] = [];

    for (const candidate of candidates) {
      if (candidate.latitude === null || candidate.longitude === null) {
        withoutCoordinates.push(candidate);
        continue;
      }

      withDistance.push({
        property: candidate,
        distanceMeters: haversineDistanceMeters(referencePoint, {
          lat: Number(candidate.latitude),
          lng: Number(candidate.longitude),
        }),
      });
    }

    withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return [...withDistance.map((entry) => entry.property), ...withoutCoordinates];
  }
}
