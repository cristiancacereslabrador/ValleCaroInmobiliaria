import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PropertyValuationEstimatorService } from './property-valuation-estimator.service';
import { EstimateValuationDto } from './dto/estimate-valuation.dto';

/**
 * Comparables internos para el staff. El visitante público no recibe un
 * precio de venta: solicita tasación (lead) y el asesor entrega un informe
 * después de conocer la propiedad.
 */
@Controller('property-valuation-estimator')
export class PropertyValuationEstimatorController {
  constructor(
    private readonly propertyValuationEstimatorService: PropertyValuationEstimatorService,
  ) {}

  @Post('estimate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  estimate(@Body() dto: EstimateValuationDto) {
    return this.propertyValuationEstimatorService.estimate(dto);
  }
}
