import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { OperationType } from '../properties/entities/operation-type.enum';
import { EstimateValuationDto } from './dto/estimate-valuation.dto';
import { computeValuationPriceRange } from './valuation-price-range.util';
import {
  PropertyValuationEstimateResult,
  ValuationRangeResult,
} from './valuation-estimate-result.interface';

const DEFAULT_MIN_COMPARABLES = 3;
// design.md - Decision 1: superficie +/-25%, habitaciones +/-1.
const SURFACE_TOLERANCE_RATIO = 0.25;
const BEDROOMS_TOLERANCE = 1;

const ORIENTATIVE_DISCLAIMER =
  'Estimación orientativa basada en captaciones comparables ya publicadas en este portal. ' +
  'No constituye una tasación oficial ni un informe pericial.';

interface RawComparableRow {
  price: string;
  surfaceM2: string;
}

/**
 * specs/property-valuation-estimator/spec.md, Requirement "Estimacion de
 * rango de precio a partir de comparables". No importa `PropertiesModule` ni
 * toca `properties.service.ts`/`properties.controller.ts` (aislamiento del
 * task brief): registra su propio `TypeOrmModule.forFeature([Property])` de
 * solo lectura, igual que `price-trends`/`nearby-services`.
 */
@Injectable()
export class PropertyValuationEstimatorService {
  constructor(
    @InjectRepository(Property)
    private readonly propertiesRepository: Repository<Property>,
    private readonly configService: ConfigService,
  ) {}

  async estimate(dto: EstimateValuationDto): Promise<PropertyValuationEstimateResult> {
    // Requirement "Formulario de tasacion independiente del catalogo
    // publicado", Escenario "Datos obligatorios ausentes": tipo y superficie
    // ya los valida el ValidationPipe global (DTO); la zona (ciudad O codigo
    // postal, basta uno) es una regla cruzada entre dos campos opcionales,
    // se valida aqui explicitamente.
    if (!dto.city && !dto.postalCode) {
      throw new BadRequestException(
        'Debe indicar ciudad o código postal para poder buscar comparables en la zona',
      );
    }

    const [sale, rent] = await Promise.all([
      this.estimateForOperation(dto, OperationType.SALE),
      this.estimateForOperation(dto, OperationType.RENT),
    ]);

    return {
      criteria: {
        type: dto.type,
        city: dto.city ?? null,
        postalCode: dto.postalCode ?? null,
        surfaceM2: dto.surfaceM2,
        bedrooms: dto.bedrooms ?? null,
        status: dto.status ?? null,
      },
      sale,
      rent,
      disclaimer: ORIENTATIVE_DISCLAIMER,
    };
  }

  private async estimateForOperation(
    dto: EstimateValuationDto,
    operationType: OperationType,
  ): Promise<ValuationRangeResult> {
    const pricesPerM2 = await this.findComparablePricesPerM2(dto, operationType);

    const minComparables = this.configService.get<number>(
      'VALUATION_ESTIMATOR_MIN_COMPARABLES',
      DEFAULT_MIN_COMPARABLES,
    );

    if (pricesPerM2.length < minComparables) {
      return { available: false, reason: 'insufficient-data' };
    }

    const { minPrice, maxPrice } = computeValuationPriceRange(pricesPerM2, dto.surfaceM2);

    return { available: true, minPrice, maxPrice, comparablesCount: pricesPerM2.length };
  }

  /**
   * design.md - Decision 1: comparables = mismo tipo, misma zona, superficie
   * +/-25%, habitaciones +/-1 (si se indican), separados por operacion
   * venta/alquiler. Devuelve el precio/m2 de cada comparable (uno por
   * propiedad encontrada).
   */
  private async findComparablePricesPerM2(
    dto: EstimateValuationDto,
    operationType: OperationType,
  ): Promise<number[]> {
    const minSurface = dto.surfaceM2 * (1 - SURFACE_TOLERANCE_RATIO);
    const maxSurface = dto.surfaceM2 * (1 + SURFACE_TOLERANCE_RATIO);

    const query = this.propertiesRepository
      .createQueryBuilder('property')
      .where('property.type = :type', { type: dto.type })
      .andWhere('property.listingStatus = :publishedStatus', { publishedStatus: 'published' })
      .andWhere('property.operationType = :operationType', { operationType })
      .andWhere('property.surfaceM2 IS NOT NULL')
      .andWhere('property.surfaceM2 BETWEEN :minSurface AND :maxSurface', {
        minSurface,
        maxSurface,
      });

    if (dto.city) {
      query.andWhere('LOWER(TRIM(property.city)) = LOWER(TRIM(:city))', { city: dto.city });
    }
    if (dto.postalCode) {
      query.andWhere('TRIM(property.postalCode) = TRIM(:postalCode)', {
        postalCode: dto.postalCode,
      });
    }
    if (dto.bedrooms !== undefined) {
      query
        .andWhere('property.bedrooms IS NOT NULL')
        .andWhere('ABS(property.bedrooms - :bedrooms) <= :bedroomsTolerance', {
          bedrooms: dto.bedrooms,
          bedroomsTolerance: BEDROOMS_TOLERANCE,
        });
    }

    const rows = await query
      .select('property.price', 'price')
      .addSelect('property.surfaceM2', 'surfaceM2')
      .getRawMany<RawComparableRow>();

    return rows
      .map((row) => ({ price: Number(row.price), surfaceM2: Number(row.surfaceM2) }))
      .filter((row) => row.surfaceM2 > 0)
      .map((row) => row.price / row.surfaceM2);
  }
}
