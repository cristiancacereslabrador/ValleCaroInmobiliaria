import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PropertyValuationEstimatorService } from './property-valuation-estimator.service';
import { EstimateValuationDto } from './dto/estimate-valuation.dto';

/**
 * specs/property-valuation-estimator/spec.md - tasks.md 2.3:
 * `POST /api/v1/property-valuation-estimator/estimate`. Endpoint sin
 * estado, no persiste nada: solo lee comparables del catalogo existente.
 */
@Controller('property-valuation-estimator')
export class PropertyValuationEstimatorController {
  constructor(
    private readonly propertyValuationEstimatorService: PropertyValuationEstimatorService,
  ) {}

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  estimate(@Body() dto: EstimateValuationDto) {
    return this.propertyValuationEstimatorService.estimate(dto);
  }
}
