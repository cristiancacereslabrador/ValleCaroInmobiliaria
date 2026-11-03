import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';
import { UploadSessionsService } from './upload-sessions.service';

/**
 * Subida reanudable por trozos (ver UploadSessionsService):
 * 1. POST   .../media/uploads                 -> crea la sesion
 * 2. PUT    .../media/uploads/:id?offset=N    -> trozo en bruto (application/octet-stream)
 *    GET    .../media/uploads/:id             -> cuantos bytes llegaron
 * 3. POST   .../media/uploads/:id/complete    -> procesa y crea el medio
 */
@Controller('properties/:propertyId/media/uploads')
@UseGuards(JwtAuthGuard)
export class UploadSessionsController {
  constructor(private readonly uploadSessionsService: UploadSessionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateUploadSessionDto,
  ) {
    return this.uploadSessionsService.create(propertyId, dto);
  }

  @Get(':uploadId')
  status(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
  ) {
    return this.uploadSessionsService.status(propertyId, uploadId);
  }

  @Put(':uploadId')
  appendChunk(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Query('offset') offset: string,
    @Req() req: Request,
  ) {
    return this.uploadSessionsService.appendChunk(propertyId, uploadId, Number(offset), req);
  }

  @Post(':uploadId/complete')
  complete(
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
  ) {
    return this.uploadSessionsService.complete(propertyId, uploadId);
  }
}
