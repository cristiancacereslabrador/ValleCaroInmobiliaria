import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Property } from './entities/property.entity';
import { PropertyPriceHistory } from './entities/property-price-history.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { ListingStatus } from './entities/listing-status.enum';
import { GeocodingService } from '../geolocation/geocoding.service';
import { isPointInPolygon } from '../geolocation/point-in-polygon.util';
import { pickCoverPhotoUrl } from '../property-media/cover-photo.util';

export interface FindPropertiesOptions {
  includeUnpublished?: boolean;
}

export type PropertyWithCover = Property & { coverPhotoUrl: string | null };

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(PropertyPriceHistory)
    private readonly priceHistoryRepository: Repository<PropertyPriceHistory>,
    private readonly geocodingService: GeocodingService,
    // saved-search-alerts (design.md - Decision 3): emite `property.created`/
    // `property.priceChanged` para que ese modulo evalue alertas activas sin
    // acoplar aqui ninguna logica de email. Este servicio no importa nada de
    // `saved-search-alerts`, solo emite eventos por nombre.
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * property-catalog spec, Requirement "Crear propiedad inmobiliaria".
   * property-geolocation spec, Requirement "Geocodificacion automatica desde
   * direccion": si llega `address` sin `latitude`/`longitude` explicitas, se
   * geocodifica automaticamente; si falla, la propiedad se guarda igualmente
   * sin coordenadas (design.md - Decision 5, Risks/Trade-offs).
   */
  async create(dto: CreatePropertyDto): Promise<PropertyWithCover> {
    const coordinates = await this.resolveCoordinates(dto);

    const property = this.propertiesRepository.create({
      ...dto,
      listingStatus: dto.listingStatus ?? ListingStatus.DRAFT,
      price: dto.price.toString(),
      surfaceM2: dto.surfaceM2 !== undefined ? dto.surfaceM2.toString() : null,
      landSurfaceM2: dto.landSurfaceM2 !== undefined ? dto.landSurfaceM2.toString() : null,
      latitude: coordinates?.latitude !== undefined ? coordinates.latitude.toString() : null,
      longitude: coordinates?.longitude !== undefined ? coordinates.longitude.toString() : null,
    });

    const saved = await this.propertiesRepository.save(property);
    // `save()` sobre una entidad recien creada con `create()` no carga la
    // relacion `media` (nunca puede tener medios todavia), pero la deja
    // `undefined`. El contrato de respuesta (ver apps/web `Property` type)
    // siempre incluye `media` como array, igual que findOne/findAll.
    saved.media = [];
    // saved-search-alerts spec.md, Requirement "Notificacion de nuevas
    // coincidencias": no se espera esta promesa (los listeners son
    // asincronos y su fallo no debe afectar a la respuesta de creacion).
    this.eventEmitter.emit('property.created', { property: saved });
    return this.withCoverPhoto(saved);
  }

  /**
   * property-catalog spec, Requirement "Listar y filtrar propiedades".
   * property-media spec, Requirement "Foto de portada de la propiedad":
   * cada propiedad del listado incluye `coverPhotoUrl` (portada explicita o
   * la primera foto cargada por defecto).
   */
  async findAll(
    query: QueryPropertiesDto,
    options: FindPropertiesOptions = {},
  ): Promise<PropertyWithCover[]> {
    const qb = this.propertiesRepository
      .createQueryBuilder('property')
      .leftJoinAndSelect('property.media', 'media');

    if (!options.includeUnpublished) {
      qb.andWhere('property.listingStatus = :publishedStatus', {
        publishedStatus: ListingStatus.PUBLISHED,
      });
    } else if (query.listingStatus) {
      qb.andWhere('property.listingStatus = :listingStatus', {
        listingStatus: query.listingStatus,
      });
    }

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

    if (query.minBedrooms !== undefined) {
      qb.andWhere('property.bedrooms >= :minBedrooms', { minBedrooms: query.minBedrooms });
    }

    if (query.hasElevator !== undefined) {
      qb.andWhere('property.hasElevator = :hasElevator', { hasElevator: query.hasElevator });
    }

    if (query.groundFloor !== undefined) {
      // `<> 0` excluye de forma natural los NULL (planta no indicada) sin
      // necesitar un `IS NOT NULL` explicito.
      qb.andWhere(query.groundFloor ? 'property.floor = :groundFloor' : 'property.floor <> :groundFloor', {
        groundFloor: 0,
      });
    }

    if (query.needsRenovation !== undefined) {
      qb.andWhere('property.needsRenovation = :needsRenovation', {
        needsRenovation: query.needsRenovation,
      });
    }

    if (query.state) {
      qb.andWhere('LOWER(TRIM(property.state)) = LOWER(TRIM(:state))', { state: query.state });
    }

    if (query.municipality) {
      qb.andWhere('LOWER(TRIM(property.municipality)) = LOWER(TRIM(:municipality))', {
        municipality: query.municipality,
      });
    }

    if (query.area !== undefined) {
      // property-geolocation spec, Requirement "Busqueda de propiedades por
      // area dibujada en el mapa": solo puede estar "dentro" de un area una
      // propiedad que tiene coordenadas; el resto queda descartada del
      // listado sin llegar a evaluarse contra el poligono.
      qb.andWhere('property.latitude IS NOT NULL').andWhere('property.longitude IS NOT NULL');
    }

    if (query.sortBy === 'price_asc') {
      qb.orderBy('property.price', 'ASC');
    } else if (query.sortBy === 'price_desc') {
      qb.orderBy('property.price', 'DESC');
    } else {
      qb.orderBy('property.createdAt', 'DESC');
    }

    const properties = await qb.getMany();

    // design.md - Decision 2: la comprobacion punto-en-poligono (ray-casting)
    // se resuelve en memoria, no en SQL espacial.
    const withinArea =
      query.area !== undefined
        ? properties.filter((property) =>
            isPointInPolygon(
              { lat: Number(property.latitude), lng: Number(property.longitude) },
              query.area!,
            ),
          )
        : properties;

    return withinArea.map((property) => this.withCoverPhoto(property));
  }

  /**
   * property-catalog spec, Requirement "Consultar detalle de una propiedad".
   * Lanza NotFoundException si el id no existe (Scenario "Consulta de una
   * propiedad inexistente").
   */
  async findOne(id: string, options: FindPropertiesOptions = {}): Promise<PropertyWithCover> {
    const property = await this.findEntityOrFail(id);
    if (!options.includeUnpublished && property.listingStatus !== ListingStatus.PUBLISHED) {
      throw new NotFoundException(`Property with id "${id}" not found`);
    }
    return this.withCoverPhoto(property);
  }

  /**
   * property-catalog spec, Requirement "Editar propiedad inmobiliaria".
   * Vuelve a geocodificar si se envia una `address` nueva sin coordenadas
   * explicitas nuevas.
   *
   * price-trends spec, Requirement "Registro de historico de precio de una
   * propiedad": si la edicion cambia el precio, se registra el precio
   * ANTERIOR (el que queda obsoleto) junto con la fecha del cambio en
   * `property_price_history`, antes de sobrescribirlo. Comparacion numerica
   * (no de string) para que enviar el mismo valor explicitamente (p. ej.
   * "150000" === 150000) no cuente como cambio (Scenario "Editar una
   * propiedad sin cambiar el precio").
   */
  async update(id: string, dto: UpdatePropertyDto): Promise<PropertyWithCover> {
    const property = await this.findEntityOrFail(id);

    const priceChanged = dto.price !== undefined && Number(dto.price) !== Number(property.price);
    const previousPrice = property.price;

    const coordinates = await this.resolveCoordinates(dto, property);

    Object.assign(property, {
      ...dto,
      price: dto.price !== undefined ? dto.price.toString() : property.price,
      surfaceM2:
        dto.surfaceM2 !== undefined ? dto.surfaceM2.toString() : property.surfaceM2,
      landSurfaceM2:
        dto.landSurfaceM2 !== undefined ? dto.landSurfaceM2.toString() : property.landSurfaceM2,
      latitude:
        coordinates?.latitude !== undefined
          ? coordinates.latitude.toString()
          : property.latitude,
      longitude:
        coordinates?.longitude !== undefined
          ? coordinates.longitude.toString()
          : property.longitude,
    });

    const saved = await this.propertiesRepository.save(property);

    if (priceChanged) {
      await this.priceHistoryRepository.save(
        this.priceHistoryRepository.create({
          propertyId: id,
          price: previousPrice,
          recordedAt: new Date(),
        }),
      );

      // saved-search-alerts spec.md, Requirement "Notificacion de cambio de
      // precio en una propiedad guardada": solo se emite cuando el precio
      // realmente cambia (misma comparacion numerica que arriba).
      this.eventEmitter.emit('property.priceChanged', {
        property: saved,
        previousPrice,
        newPrice: saved.price,
      });
    }

    return this.withCoverPhoto(saved);
  }

  /**
   * price-trends spec, Requirement "Registro de historico de precio de una
   * propiedad". Devuelve los registros de historico de precio de una
   * propiedad en orden cronologico (mas antiguo primero); no incluye el
   * precio actual (ver Scenario "Precio inicial de una propiedad nueva" -
   * ese vive unicamente en `properties.price` hasta la primera edicion que
   * lo cambie).
   */
  async getPriceHistory(id: string): Promise<PropertyPriceHistory[]> {
    await this.findEntityOrFail(id);

    return this.priceHistoryRepository.find({
      where: { propertyId: id },
      order: { recordedAt: 'ASC' },
    });
  }

  /**
   * property-catalog spec, Requirement "Eliminar propiedad inmobiliaria".
   * Lanza NotFoundException si el id no existe (Scenario "Baja de una
   * propiedad inexistente").
   */
  async remove(id: string): Promise<void> {
    const result = await this.propertiesRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Property with id "${id}" not found`);
    }
  }

  /**
   * Resuelve las coordenadas a persistir para create/update:
   * - Si llegan `latitude`/`longitude` explicitas en el DTO, se usan tal
   *   cual (ya validadas en rango por CreatePropertyDto/UpdatePropertyDto).
   * - Si llega `address` (nueva o distinta de la existente) sin coordenadas
   *   explicitas, se geocodifica automaticamente.
   * - En cualquier otro caso, se devuelve `undefined` (no tocar el valor
   *   existente en `update`).
   */
  private async resolveCoordinates(
    dto: CreatePropertyDto | UpdatePropertyDto,
    existing?: Property,
  ): Promise<{ latitude?: number; longitude?: number } | undefined> {
    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      return { latitude: dto.latitude, longitude: dto.longitude };
    }

    const addressChanged = dto.address !== undefined && dto.address !== existing?.address;
    const hasNoStoredCoordinates = !existing?.latitude || !existing?.longitude;

    if (dto.address && (addressChanged || hasNoStoredCoordinates)) {
      const coordinates = await this.geocodingService.geocodeAddress(dto.address);

      if (!coordinates) {
        this.logger.warn(
          `No se pudieron obtener coordenadas para la direccion "${dto.address}"; la propiedad se guarda sin ubicacion en mapa`,
        );
        return undefined;
      }

      return coordinates;
    }

    return undefined;
  }

  private async findEntityOrFail(id: string): Promise<Property> {
    const property = await this.propertiesRepository.findOne({
      where: { id },
      relations: ['media'],
    });

    if (!property) {
      throw new NotFoundException(`Property with id "${id}" not found`);
    }

    return property;
  }

  private withCoverPhoto(property: Property): PropertyWithCover {
    return {
      ...property,
      coverPhotoUrl: pickCoverPhotoUrl(property.media ?? []),
    };
  }
}
