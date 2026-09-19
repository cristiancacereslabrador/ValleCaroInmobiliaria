import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { SimilarPropertiesService } from './similar-properties.service';

/**
 * similar-properties spec, Requirement "Visualizacion de propiedades
 * similares en la ficha" - tasks.md 1.3: `GET /api/v1/properties/:id/similar`.
 *
 * Controller propio y aislado (no `properties.controller.ts`): mismo patron
 * ya usado por `price-trends` (`properties/:id/price-trend`) y
 * `nearby-services` para registrar una ruta hija de `properties/:id` desde
 * otro modulo sin tocar `PropertiesController`.
 */
@Controller('properties/:id/similar')
export class SimilarPropertiesController {
  constructor(private readonly similarPropertiesService: SimilarPropertiesService) {}

  @Get()
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.similarPropertiesService.getSimilar(id);
  }
}
