import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PropertyMediaService } from './property-media.service';
import { MulterExceptionFilter } from './multer-exception.filter';

// Limite "duro" a nivel de multer, previo a la validacion de negocio
// (configurable por MEDIA_MAX_IMAGE_SIZE_MB/MEDIA_MAX_VIDEO_SIZE_MB) que
// hace PropertyMediaService segun el tipo de archivo. Se fija al mayor de
// los dos limites (video, 100 MB por defecto) como cota de seguridad; el
// limite real y configurable por tipo se aplica despues en el servicio.
const HARD_UPLOAD_SIZE_LIMIT_BYTES = 100 * 1024 * 1024;

@Controller('properties/:propertyId/media')
@UseFilters(MulterExceptionFilter)
export class PropertyMediaController {
  constructor(private readonly propertyMediaService: PropertyMediaService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: HARD_UPLOAD_SIZE_LIMIT_BYTES },
    }),
  )
  upload(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @UploadedFile() file: Express.Multer.File,
    // Campo opcional de formulario "type": unica forma de distinguir un
    // tour virtual 360 de una foto normal, ya que ambos son imagenes con
    // las mismas extensiones soportadas (property-virtual-tours -
    // tasks.md 1.2). Si se omite, el tipo se infiere por extension como
    // hasta ahora (photo/video), nunca se infiere tour360 automaticamente.
    @Body('type') type?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibio ningun archivo (campo "file")');
    }

    return this.propertyMediaService.uploadMedia(propertyId, file, type);
  }

  @Get()
  findAll(@Param('propertyId', ParseUUIDPipe) propertyId: string) {
    return this.propertyMediaService.findAllForProperty(propertyId);
  }

  @Delete(':mediaId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    await this.propertyMediaService.remove(propertyId, mediaId);
  }

  @Patch(':mediaId/cover')
  @UseGuards(JwtAuthGuard)
  markCover(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.propertyMediaService.markCover(propertyId, mediaId);
  }
}
