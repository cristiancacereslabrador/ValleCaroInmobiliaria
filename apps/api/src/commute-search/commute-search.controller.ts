import { Controller, Get, Query } from '@nestjs/common';
import { CommuteSearchService } from './commute-search.service';
import { QueryCommuteSearchDto } from './dto/query-commute-search.dto';

/**
 * commute-search spec: `GET /api/v1/commute-search`. Endpoint propio y
 * aislado (no extiende `GET /api/v1/properties`) para no depender de un
 * cambio compartido en `properties.controller.ts` mientras otros modulos se
 * desarrollan en paralelo sobre ese mismo controller.
 */
@Controller('commute-search')
export class CommuteSearchController {
  constructor(private readonly commuteSearchService: CommuteSearchService) {}

  @Get()
  search(@Query() query: QueryCommuteSearchDto) {
    return this.commuteSearchService.search(query);
  }
}
