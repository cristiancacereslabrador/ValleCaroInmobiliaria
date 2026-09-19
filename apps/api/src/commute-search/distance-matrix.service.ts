import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { GeoPoint } from '../geolocation/point-in-polygon.util';
import { TransportMode } from './transport-mode.enum';

const DISTANCE_MATRIX_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';

/**
 * Limite practico de origenes por request (design.md - Decision 1: "en
 * lotes, respetando el limite de destinos por request de la API"). La
 * Distance Matrix API limita a 25 origenes/destinos y 100 elementos
 * (origenes x destinos) por request; con un unico destino por busqueda, el
 * limite relevante aqui es el de origenes.
 */
const MAX_ORIGINS_PER_REQUEST = 25;

interface DistanceMatrixElement {
  status: string;
  duration?: { value: number; text: string };
}

interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponse {
  status: string;
  rows?: DistanceMatrixRow[];
}

/**
 * Se lanza cuando la Distance Matrix API no responde, responde con error, o
 * no hay clave de API configurada. Quien la invoca (CommuteSearchService)
 * decide como comunicarlo (spec, Requirement "Manejo de error del servicio
 * de calculo de trayectos").
 */
export class DistanceMatrixError extends Error {}

/**
 * Cliente de la Google Distance Matrix API (design.md - Decision 1 y 2).
 * Dado un destino unico y un conjunto de origenes (propiedades candidatas),
 * devuelve el tiempo de trayecto en segundos para cada origen, en el mismo
 * orden que se recibieron, o `null` cuando esa ruta concreta no es
 * resoluble (p. ej. sin ruta a pie disponible entre esos dos puntos).
 */
@Injectable()
export class DistanceMatrixService {
  private readonly logger = new Logger(DistanceMatrixService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getDurationsSeconds(
    origins: GeoPoint[],
    destination: GeoPoint,
    transportMode: TransportMode,
  ): Promise<Array<number | null>> {
    if (origins.length === 0) {
      return [];
    }

    const apiKey = this.configService.get<string>('GOOGLE_MAPS_SERVER_API_KEY');

    if (!apiKey) {
      throw new DistanceMatrixError(
        'GOOGLE_MAPS_SERVER_API_KEY no configurada: no se puede calcular el tiempo de trayecto',
      );
    }

    const batches = chunk(origins, MAX_ORIGINS_PER_REQUEST);
    const durations: Array<number | null> = [];

    for (const batch of batches) {
      durations.push(...(await this.requestBatch(batch, destination, transportMode, apiKey)));
    }

    return durations;
  }

  private async requestBatch(
    origins: GeoPoint[],
    destination: GeoPoint,
    transportMode: TransportMode,
    apiKey: string,
  ): Promise<Array<number | null>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<DistanceMatrixResponse>(DISTANCE_MATRIX_API_URL, {
          params: {
            origins: origins.map((origin) => `${origin.lat},${origin.lng}`).join('|'),
            destinations: `${destination.lat},${destination.lng}`,
            mode: transportMode,
            key: apiKey,
          },
        }),
      );

      const data = response.data;

      if (data.status !== 'OK') {
        throw new DistanceMatrixError(
          `Google Distance Matrix respondio con status "${data.status}"`,
        );
      }

      return (data.rows ?? []).map((row) => {
        const element = row.elements?.[0];
        return element && element.status === 'OK' && element.duration
          ? element.duration.value
          : null;
      });
    } catch (error) {
      if (error instanceof DistanceMatrixError) {
        throw error;
      }
      this.logger.warn(`Error llamando a la Distance Matrix API: ${(error as Error).message}`);
      throw new DistanceMatrixError((error as Error).message);
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
