import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post } from '@nestjs/common';
import { SavedSearchAlertsService } from './saved-search-alerts.service';
import { CreateSavedSearchAlertDto } from './dto/create-saved-search-alert.dto';

/**
 * Los tokens de confirmacion/baja se tratan como strings opacos (no
 * `ParseUUIDPipe`), mismo criterio que `saved-property-lists`: un token
 * malformado y uno bien formado pero inexistente terminan en el mismo 404
 * del servicio.
 *
 * `confirm`/`unsubscribe` son GET (no POST): se activan al clicar un enlace
 * de email desde el navegador, sin ningun formulario de por medio - patron
 * habitual de doble opt-in / bajas de lista de correo.
 */
@Controller('saved-search-alerts')
export class SavedSearchAlertsController {
  constructor(private readonly savedSearchAlertsService: SavedSearchAlertsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSavedSearchAlertDto, @Ip() ip: string) {
    return this.savedSearchAlertsService.create(dto, ip ?? null);
  }

  @Get('confirm/:token')
  confirm(@Param('token') token: string) {
    return this.savedSearchAlertsService.confirm(token);
  }

  @Get('unsubscribe/:token')
  unsubscribe(@Param('token') token: string) {
    return this.savedSearchAlertsService.unsubscribe(token);
  }
}
