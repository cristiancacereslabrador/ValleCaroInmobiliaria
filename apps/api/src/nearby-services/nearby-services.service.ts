import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { haversineDistanceMeters } from '../geolocation/haversine.util';
import { NearbyPlace, NearbyServicesCategories, NearbyServicesResult } from './nearby-place.interface';

const NEARBY_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const DEFAULT_RADIUS_METERS = 1000;

/**
 * design.md - Decision 1: categorias colegio/transporte/supermercado
 * mapeadas a los tipos de Google Places. "Transporte" agrupa varios tipos de
 * Google (no hay un unico tipo "transporte publico" en la Places API), asi
 * que se consultan por separado y se combinan (dedupe por `place_id`).
 */
const CATEGORY_GOOGLE_TYPES: Record<keyof NearbyServicesCategories, string[]> = {
  schools: ['school'],
  transitStops: ['transit_station', 'bus_station', 'subway_station'],
  supermarkets: ['supermarket'],
};

interface GooglePlaceResult {
  place_id: string;
  name: string;
  geometry: { location: { lat: number; lng: number } };
}

interface GooglePlacesResponse {
  status: string;
  results?: GooglePlaceResult[];
}

/**
 * nearby-services spec, Requirement "Consulta de puntos de interes cercanos"
 * y "Manejo de error del servicio de puntos de interes" (design.md -
 * Decision 1: Google Places API Nearby Search, sin cachear resultados en
 * BD).
 */
@Injectable()
export class NearbyServicesService {
  private readonly logger = new Logger(NearbyServicesService.name);

  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Scenario "Propiedad sin coordenadas": si la propiedad no tiene
   * latitud/longitud, se informa sin llegar a llamar a Google Places (no
   * bloquea el resto de la ficha).
   */
  async getForProperty(propertyId: string): Promise<NearbyServicesResult> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException(`Property with id "${propertyId}" not found`);
    }

    if (!property.latitude || !property.longitude) {
      return { available: false, reason: 'no-coordinates' };
    }

    return this.getNearbyServicesForCoordinates(Number(property.latitude), Number(property.longitude));
  }

  /**
   * Consulta las tres categorias para unas coordenadas dadas y las agrupa
   * (Scenario "Propiedad con coordenadas y puntos de interes en el radio").
   * Cualquier fallo de la llamada HTTP (red, status distinto de OK/
   * ZERO_RESULTS, o falta de API key) se trata como "servicio no disponible"
   * en bloque (Scenario "Servicio no disponible") en vez de resultados
   * parciales, para no mostrar un entorno incompleto sin avisar.
   */
  async getNearbyServicesForCoordinates(
    latitude: number,
    longitude: number,
  ): Promise<NearbyServicesResult> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_SERVER_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'GOOGLE_MAPS_SERVER_API_KEY no configurada: no se puede consultar el entorno de la propiedad',
      );
      return { available: false, reason: 'service-unavailable' };
    }

    const radiusMeters = this.configService.get<number>(
      'NEARBY_SERVICES_RADIUS_METERS',
      DEFAULT_RADIUS_METERS,
    );

    try {
      const [schools, transitStops, supermarkets] = await Promise.all([
        this.searchCategory(latitude, longitude, radiusMeters, CATEGORY_GOOGLE_TYPES.schools, apiKey),
        this.searchCategory(
          latitude,
          longitude,
          radiusMeters,
          CATEGORY_GOOGLE_TYPES.transitStops,
          apiKey,
        ),
        this.searchCategory(
          latitude,
          longitude,
          radiusMeters,
          CATEGORY_GOOGLE_TYPES.supermarkets,
          apiKey,
        ),
      ]);

      return { available: true, categories: { schools, transitStops, supermarkets } };
    } catch (error) {
      this.logger.warn(
        `Error consultando Google Places Nearby Search: ${(error as Error).message}`,
      );
      return { available: false, reason: 'service-unavailable' };
    }
  }

  private async searchCategory(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    googleTypes: string[],
    apiKey: string,
  ): Promise<NearbyPlace[]> {
    const resultsByType = await Promise.all(
      googleTypes.map((type) => this.searchByType(latitude, longitude, radiusMeters, type, apiKey)),
    );

    const byPlaceId = new Map<string, NearbyPlace>();
    for (const places of resultsByType) {
      for (const place of places) {
        if (!byPlaceId.has(place.placeId)) {
          byPlaceId.set(place.placeId, { name: place.name, distanceMeters: place.distanceMeters });
        }
      }
    }

    return Array.from(byPlaceId.values()).sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  private async searchByType(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    googleType: string,
    apiKey: string,
  ): Promise<Array<NearbyPlace & { placeId: string }>> {
    const response = await firstValueFrom(
      this.httpService.get<GooglePlacesResponse>(NEARBY_SEARCH_URL, {
        params: { location: `${latitude},${longitude}`, radius: radiusMeters, type: googleType, key: apiKey },
      }),
    );

    const data = response.data;

    if (data.status === 'ZERO_RESULTS') {
      return [];
    }

    if (data.status !== 'OK') {
      throw new Error(`Google Places respondio con status "${data.status}" para el tipo "${googleType}"`);
    }

    return (data.results ?? []).map((result) => ({
      placeId: result.place_id,
      name: result.name,
      distanceMeters: haversineDistanceMeters(
        { lat: latitude, lng: longitude },
        { lat: result.geometry.location.lat, lng: result.geometry.location.lng },
      ),
    }));
  }
}
