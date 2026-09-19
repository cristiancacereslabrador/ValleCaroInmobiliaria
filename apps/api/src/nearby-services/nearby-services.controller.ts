import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { NearbyServicesService } from './nearby-services.service';

/**
 * nearby-services spec, Requirement "Visualizacion del entorno en la ficha
 * de propiedad" - tasks.md 3.2: `GET /api/v1/properties/:id/nearby-services`.
 */
@Controller('properties/:id/nearby-services')
export class NearbyServicesController {
  constructor(private readonly nearbyServicesService: NearbyServicesService) {}

  @Get()
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.nearbyServicesService.getForProperty(id);
  }
}
