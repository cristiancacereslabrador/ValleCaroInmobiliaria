import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { SavedPropertyListsService } from './saved-property-lists.service';
import { CreateSavedPropertyListDto } from './dto/create-saved-property-list.dto';
import { AddPropertyToListDto } from './dto/add-property-to-list.dto';

/**
 * Los tokens de gestión/solo lectura se tratan como strings opacos (no
 * `ParseUUIDPipe`): un token malformado y uno bien formado pero inexistente
 * deben comportarse igual (spec.md, Scenario "Gestión con identificador
 * inválido") — ambos terminan en el mismo 404 del servicio, en vez de un 400
 * de formato para uno y un 404 para el otro.
 */
@Controller('saved-property-lists')
export class SavedPropertyListsController {
  constructor(private readonly savedPropertyListsService: SavedPropertyListsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSavedPropertyListDto) {
    return this.savedPropertyListsService.create(dto);
  }

  @Get('manage/:managementToken')
  findByManagementToken(@Param('managementToken') managementToken: string) {
    return this.savedPropertyListsService.findByManagementToken(managementToken);
  }

  @Get('shared/:shareToken')
  findByShareToken(@Param('shareToken') shareToken: string) {
    return this.savedPropertyListsService.findByShareToken(shareToken);
  }

  @Post('manage/:managementToken/items')
  @HttpCode(HttpStatus.CREATED)
  addProperty(
    @Param('managementToken') managementToken: string,
    @Body() dto: AddPropertyToListDto,
  ) {
    return this.savedPropertyListsService.addProperty(managementToken, dto);
  }

  @Delete('manage/:managementToken/items/:propertyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProperty(
    @Param('managementToken') managementToken: string,
    @Param('propertyId') propertyId: string,
  ) {
    await this.savedPropertyListsService.removeProperty(managementToken, propertyId);
  }
}
