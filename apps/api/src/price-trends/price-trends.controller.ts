import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { PriceTrendsService } from './price-trends.service';

/**
 * price-trends spec, Requirement "Visualizacion de la evolucion de precio en
 * la ficha de propiedad" - tasks.md 4.3: `GET /api/v1/properties/:id/price-trend`,
 * resolviendo la zona (ciudad + codigo postal) a partir de la propia
 * propiedad, igual que `nearby-services`.
 */
@Controller('properties/:id/price-trend')
export class PriceTrendsController {
  constructor(private readonly priceTrendsService: PriceTrendsService) {}

  @Get()
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.priceTrendsService.getForProperty(id);
  }
}
