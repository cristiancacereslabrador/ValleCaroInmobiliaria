import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { PropertyPriceHistory } from '../properties/entities/property-price-history.entity';
import { computeMonthlyPriceTrend, PriceHistoryPoint } from './price-trend.util';
import { PriceTrendResult } from './price-trend-result.interface';

const DEFAULT_MIN_PROPERTIES = 3;

interface RawPricePointRow {
  propertyId: string;
  price: string;
  surfaceM2: string | null;
  recordedAt: Date;
}

/**
 * price-trends spec (design.md - Decision 3): "zona" = combinacion (ciudad,
 * codigo postal), normalizados (trim + minusculas para ciudad, trim para
 * codigo postal) al comparar/agrupar - Risks/Trade-offs: evita fragmentar la
 * misma zona por variantes de escritura ("San Cristóbal" vs "san cristóbal ").
 *
 * Se agrega EXCLUSIVAMENTE a partir de filas de `property_price_history`
 * (no del precio actual en vivo de `properties`): tanto el Requirement
 * "Calculo de evolucion..." ("agregando los precios historicos") como el
 * umbral minimo ("propiedades distintas CON HISTORICO") se leen en sentido
 * literal sobre esa tabla - ver resumen final del change para el detalle de
 * esta decision.
 */
@Injectable()
export class PriceTrendsService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    @InjectRepository(PropertyPriceHistory)
    private readonly priceHistoryRepository: Repository<PropertyPriceHistory>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * price-trends spec, Requirement "Visualizacion de la evolucion de precio
   * en la ficha de propiedad", Scenario "Ficha sin tendencia de zona
   * disponible": si la propiedad no tiene ciudad o codigo postal registrados,
   * se informa sin intentar calcular una zona.
   */
  async getForProperty(propertyId: string): Promise<PriceTrendResult> {
    const property = await this.propertiesRepository.findOne({ where: { id: propertyId } });

    if (!property) {
      throw new NotFoundException(`Property with id "${propertyId}" not found`);
    }

    if (!property.city || !property.postalCode) {
      return { available: false, reason: 'no-zone' };
    }

    return this.getForZone(property.city, property.postalCode);
  }

  /**
   * Requirement "Calculo de evolucion de precio medio por m2 en una zona":
   * cuenta las propiedades DISTINTAS con al menos un punto de historico
   * valido (con superficie registrada) en la zona; por debajo del umbral
   * minimo configurable (por defecto 3), informa de datos insuficientes en
   * vez de devolver una serie poco representativa (tasks.md 4.2).
   */
  async getForZone(city: string, postalCode: string): Promise<PriceTrendResult> {
    const rows = await this.priceHistoryRepository
      .createQueryBuilder('history')
      .innerJoin('history.property', 'property')
      .where('LOWER(TRIM(property.city)) = LOWER(TRIM(:city))', { city })
      .andWhere('TRIM(property.postalCode) = TRIM(:postalCode)', { postalCode })
      .select('history.propertyId', 'propertyId')
      .addSelect('history.price', 'price')
      .addSelect('property.surfaceM2', 'surfaceM2')
      .addSelect('history.recordedAt', 'recordedAt')
      .getRawMany<RawPricePointRow>();

    const points: PriceHistoryPoint[] = rows
      .filter((row) => row.surfaceM2 !== null && Number(row.surfaceM2) > 0)
      .map((row) => ({
        propertyId: row.propertyId,
        price: Number(row.price),
        surfaceM2: Number(row.surfaceM2),
        recordedAt: row.recordedAt,
      }));

    const distinctProperties = new Set(points.map((point) => point.propertyId)).size;
    const minProperties = this.configService.get<number>(
      'PRICE_TREND_MIN_PROPERTIES',
      DEFAULT_MIN_PROPERTIES,
    );

    if (distinctProperties < minProperties) {
      return { available: false, reason: 'insufficient-data' };
    }

    return { available: true, series: computeMonthlyPriceTrend(points) };
  }
}
