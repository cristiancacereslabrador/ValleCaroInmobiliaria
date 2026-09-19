import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface GeocodedCoordinates {
  latitude: number;
  longitude: number;
}

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * property-geolocation spec, Requirement "Geocodificacion automatica desde
 * direccion": resuelve latitud/longitud a partir de una direccion mediante
 * la Geocoding API de Google (design.md - Decision 5).
 *
 * Requirement "Manejo de error del servicio de Google Maps": si el servicio
 * no responde, la clave no es valida, o la direccion no es geocodificable,
 * `geocodeAddress` devuelve `null` en vez de lanzar - quien la llama decide
 * continuar sin coordenadas (nunca bloquea la operacion sobre la propiedad).
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async geocodeAddress(address: string): Promise<GeocodedCoordinates | null> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_SERVER_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'GOOGLE_MAPS_SERVER_API_KEY no configurada: se omite la geocodificacion automatica',
      );
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(GEOCODING_API_URL, {
          params: { address, key: apiKey },
        }),
      );

      const data = response.data as {
        status: string;
        results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
      };

      if (data.status !== 'OK' || !data.results?.length) {
        this.logger.warn(
          `No se pudo geocodificar la direccion "${address}" (status: ${data.status})`,
        );
        return null;
      }

      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    } catch (error) {
      this.logger.warn(
        `Error llamando a la Geocoding API para "${address}": ${(error as Error).message}`,
      );
      return null;
    }
  }
}
