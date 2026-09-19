import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * design.md - Decision 4: "Almacenamiento de medios: filesystem local
 * servido como estatico, con ruta abstraida". Guarda los archivos bajo
 * `<MEDIA_STORAGE_PATH>/<property_id>/<uuid>.<ext>` y devuelve la ruta
 * publica bajo la que ese archivo se sirve como recurso estatico
 * (ver main.ts - useStaticAssets), que es lo que se persiste en
 * `property_media.url`.
 *
 * Implementacion inicial sobre filesystem local; el resto del sistema solo
 * conoce esta interfaz (saveFile/deleteFile), por lo que sustituirla por un
 * backend tipo S3/MinIO en el futuro (ver design.md - Risks/Trade-offs) no
 * requiere tocar PropertyMediaService ni la API publica de property-media.
 */
@Injectable()
export class MediaStorageService {
  private readonly storageRoot: string;
  private readonly publicUrlPrefix = '/media/properties';

  constructor(private readonly configService: ConfigService) {
    const configuredPath = this.configService.get<string>(
      'MEDIA_STORAGE_PATH',
      'storage/properties',
    );
    this.storageRoot = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  getPublicUrlPrefix(): string {
    return this.publicUrlPrefix;
  }

  getStorageRoot(): string {
    return this.storageRoot;
  }

  async saveFile(
    propertyId: string,
    file: { originalname: string; buffer: Buffer },
  ): Promise<string> {
    const propertyDir = path.join(this.storageRoot, propertyId);
    await fs.mkdir(propertyDir, { recursive: true });

    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `${randomUUID()}${extension}`;
    const filePath = path.join(propertyDir, filename);

    await fs.writeFile(filePath, file.buffer);

    return `${this.publicUrlPrefix}/${propertyId}/${filename}`;
  }

  async deleteFile(url: string): Promise<void> {
    const filePath = this.resolveFilePath(url);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveFilePath(url: string): string {
    const relative = url.startsWith(this.publicUrlPrefix)
      ? url.slice(this.publicUrlPrefix.length)
      : url;

    return path.join(this.storageRoot, relative);
  }
}
