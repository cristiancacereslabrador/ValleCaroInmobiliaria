import * as path from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyMedia } from './entities/property-media.entity';
import { MediaType } from './entities/media-type.enum';
import { MediaStorageService } from './media-storage.service';
import { PropertiesService } from '../properties/properties.service';

const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.webm'];

export interface UploadableFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * property-media spec: sube, lista, elimina y marca portada de fotos,
 * videos y tours virtuales 360 asociados a una propiedad (design.md -
 * Decision 4; property-virtual-tours/design.md - Decision 1).
 */
@Injectable()
export class PropertyMediaService {
  constructor(
    @InjectRepository(PropertyMedia)
    private readonly mediaRepository: Repository<PropertyMedia>,
    private readonly mediaStorageService: MediaStorageService,
    private readonly propertiesService: PropertiesService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Requirement "Subir fotos/videos a una propiedad": rechaza si la
   * propiedad no existe (Scenario "Carga de foto sobre propiedad
   * inexistente").
   * Requirement "Validacion de formatos y tamano de archivo": rechaza
   * formatos/tamanos no soportados antes de persistir el archivo.
   * Requirement "Subir un tour virtual 360 a una propiedad"
   * (property-virtual-tours): `requestedType` permite pedir
   * explicitamente `tour360` para una imagen (misma validacion de
   * formato/tamano que una foto); sin el, el tipo se infiere por
   * extension como hasta ahora.
   */
  async uploadMedia(
    propertyId: string,
    file: UploadableFile,
    requestedType?: string,
  ): Promise<PropertyMedia> {
    await this.propertiesService.findOne(propertyId, { includeUnpublished: true });

    const mediaType = this.resolveMediaType(file, requestedType);
    this.validateFileSize(mediaType, file.size);

    const url = await this.mediaStorageService.saveFile(propertyId, file);

    const [position, photoCount] = await Promise.all([
      this.mediaRepository.count({ where: { propertyId } }),
      mediaType === MediaType.PHOTO
        ? this.mediaRepository.count({ where: { propertyId, type: MediaType.PHOTO } })
        : Promise.resolve(1), // irrelevante para videos
    ]);

    const media = this.mediaRepository.create({
      propertyId,
      type: mediaType,
      url,
      position,
      // Requirement "Foto de portada de la propiedad" - Scenario "Propiedad
      // sin foto de portada asignada": la primera foto cargada se marca
      // portada automaticamente.
      isCover: mediaType === MediaType.PHOTO && photoCount === 0,
    });

    return this.mediaRepository.save(media);
  }

  /** Requirement "Listar medios de una propiedad". */
  async findAllForProperty(propertyId: string): Promise<PropertyMedia[]> {
    await this.propertiesService.findOne(propertyId, { includeUnpublished: true });

    return this.mediaRepository.find({
      where: { propertyId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  /**
   * Requirement "Eliminar un medio de una propiedad": elimina el registro y
   * el archivo fisico; rechaza si el medio no existe.
   */
  async remove(propertyId: string, mediaId: string): Promise<void> {
    const media = await this.findMediaOrFail(propertyId, mediaId);

    await this.mediaStorageService.deleteFile(media.url);
    await this.mediaRepository.delete(media.id);

    if (media.isCover) {
      await this.promoteNextCover(propertyId);
    }
  }

  /**
   * Requirement "Foto de portada de la propiedad" - Scenario "Designar foto
   * de portada".
   */
  async markCover(propertyId: string, mediaId: string): Promise<PropertyMedia> {
    const media = await this.findMediaOrFail(propertyId, mediaId);

    if (media.type !== MediaType.PHOTO) {
      throw new BadRequestException('Solo una foto puede marcarse como portada');
    }

    await this.mediaRepository.update(
      { propertyId, type: MediaType.PHOTO },
      { isCover: false },
    );

    media.isCover = true;
    return this.mediaRepository.save(media);
  }

  private async findMediaOrFail(propertyId: string, mediaId: string): Promise<PropertyMedia> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId, propertyId },
    });

    if (!media) {
      throw new NotFoundException(
        `Media with id "${mediaId}" not found for property "${propertyId}"`,
      );
    }

    return media;
  }

  /**
   * Mantiene el invariante "si hay fotos, siempre hay una portada": si se
   * elimina la foto marcada como portada y quedan otras fotos, promociona la
   * mas antigua a portada.
   */
  private async promoteNextCover(propertyId: string): Promise<void> {
    const remainingPhotos = await this.mediaRepository.find({
      where: { propertyId, type: MediaType.PHOTO },
      order: { position: 'ASC', createdAt: 'ASC' },
      take: 1,
    });

    if (remainingPhotos.length > 0) {
      remainingPhotos[0].isCover = true;
      await this.mediaRepository.save(remainingPhotos[0]);
    }
  }

  /**
   * `requestedType === 'tour360'` (property-virtual-tours - tasks.md 1.2):
   * un tour virtual es, a efectos de formato, una imagen mas - reutiliza
   * exactamente `ALLOWED_PHOTO_EXTENSIONS`. Cualquier otro valor de
   * `requestedType` (incluido undefined) no cambia el comportamiento
   * existente: el tipo se infiere solo por extension (photo/video), nunca
   * se infiere tour360 automaticamente sin pedirlo explicitamente.
   */
  private resolveMediaType(file: UploadableFile, requestedType?: string): MediaType {
    const extension = path.extname(file.originalname).toLowerCase();
    const normalizedRequestedType = requestedType?.trim().toLowerCase();

    if (normalizedRequestedType === MediaType.TOUR_360) {
      if (!ALLOWED_PHOTO_EXTENSIONS.includes(extension)) {
        throw new BadRequestException(
          `Formato de archivo no soportado para tour virtual 360: "${
            extension || file.mimetype
          }". Formatos permitidos: ${ALLOWED_PHOTO_EXTENSIONS.join(', ')}`,
        );
      }

      return MediaType.TOUR_360;
    }

    if (ALLOWED_PHOTO_EXTENSIONS.includes(extension)) {
      return MediaType.PHOTO;
    }

    if (ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
      return MediaType.VIDEO;
    }

    throw new BadRequestException(
      `Formato de archivo no soportado: "${extension || file.mimetype}". Formatos permitidos: ${[
        ...ALLOWED_PHOTO_EXTENSIONS,
        ...ALLOWED_VIDEO_EXTENSIONS,
      ].join(', ')}`,
    );
  }

  private validateFileSize(type: MediaType, sizeInBytes: number): void {
    const maxSizeMb = Number(
      type === MediaType.VIDEO
        ? this.configService.get('MEDIA_MAX_VIDEO_SIZE_MB', 100)
        : this.configService.get('MEDIA_MAX_IMAGE_SIZE_MB', 10),
    );
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (sizeInBytes > maxSizeBytes) {
      throw new BadRequestException(
        `El archivo excede el tamano maximo permitido (${maxSizeMb} MB)`,
      );
    }
  }
}
