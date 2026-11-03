import { randomUUID } from 'node:crypto';
import { createWriteStream, promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { Readable } from 'node:stream';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { PropertiesService } from '../properties/properties.service';
import { PropertyMedia } from './entities/property-media.entity';
import { MediaStorageService } from './media-storage.service';
import { PropertyMediaService } from './property-media.service';
import { maxUploadSizeMb } from './multer-exception.filter';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';

/** Tamano de trozo que se le propone al cliente. */
export const UPLOAD_CHUNK_SIZE = 5 * 1024 * 1024;
// Margen por si el cliente usa un trozo algo mayor; nunca se acepta mas.
const MAX_CHUNK_BYTES = 16 * 1024 * 1024;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

interface UploadSessionMeta {
  id: string;
  propertyId: string;
  filename: string;
  mimetype: string;
  size: number;
  type?: string;
  createdAt: number;
  mediaId?: string;
}

export interface UploadSessionStatus {
  uploadId: string;
  received: number;
  size: number;
  chunkSize: number;
}

/**
 * Subida reanudable por trozos. En el telefono la subida se corta cuando se
 * apaga la pantalla o se cambia de app; con una sola peticion habia que
 * volver a mandar el archivo entero. Aqui cada trozo se anade al archivo
 * parcial en disco (dentro del volumen de medios, sobrevive a un redeploy) y
 * el cliente pregunta cuanto llego para seguir desde ahi.
 */
@Injectable()
export class UploadSessionsService {
  private readonly root: string;
  private readonly writing = new Set<string>();
  private readonly completing = new Map<string, Promise<PropertyMedia>>();

  constructor(
    mediaStorageService: MediaStorageService,
    private readonly propertyMediaService: PropertyMediaService,
    private readonly propertiesService: PropertiesService,
  ) {
    this.root = path.join(mediaStorageService.getStorageRoot(), '..', 'uploads');
  }

  async create(propertyId: string, dto: CreateUploadSessionDto): Promise<UploadSessionStatus> {
    await this.propertiesService.findOne(propertyId, { includeUnpublished: true });

    const maxMb = maxUploadSizeMb();
    if (dto.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`El archivo excede el tamaño máximo permitido (${maxMb} MB)`);
    }

    await fs.mkdir(this.root, { recursive: true });
    await this.removeStaleSessions();

    const meta: UploadSessionMeta = {
      id: randomUUID(),
      propertyId,
      filename: path.basename(dto.filename),
      mimetype: dto.mimetype ?? '',
      size: dto.size,
      type: dto.type,
      createdAt: Date.now(),
    };
    await fs.writeFile(this.partPath(meta.id), Buffer.alloc(0));
    await this.writeMeta(meta);

    return this.toStatus(meta, 0);
  }

  async status(propertyId: string, uploadId: string): Promise<UploadSessionStatus> {
    const meta = await this.readMeta(propertyId, uploadId);
    return this.toStatus(meta, meta.mediaId ? meta.size : await this.receivedBytes(uploadId));
  }

  /**
   * Anade un trozo empezando en `offset`. Si el offset no coincide con lo
   * recibido (por ejemplo, un trozo anterior se corto a medias) responde 409
   * con lo recibido, para que el cliente siga desde ahi. Un trozo cortado a
   * medias deja sus bytes escritos: el siguiente intento continua detras.
   */
  async appendChunk(
    propertyId: string,
    uploadId: string,
    offset: number,
    body: Readable,
  ): Promise<UploadSessionStatus> {
    const meta = await this.readMeta(propertyId, uploadId);
    if (meta.mediaId) {
      return this.toStatus(meta, meta.size);
    }
    if (this.writing.has(uploadId)) {
      throw new ConflictException({
        message: 'Ya se está recibiendo un trozo de este archivo',
        received: await this.receivedBytes(uploadId),
      });
    }

    this.writing.add(uploadId);
    try {
      const received = await this.receivedBytes(uploadId);
      if (!Number.isInteger(offset) || offset !== received) {
        throw new ConflictException({ message: 'Offset desfasado', received });
      }

      const remaining = meta.size - received;
      await this.pipeLimited(body, this.partPath(uploadId), Math.min(remaining, MAX_CHUNK_BYTES));

      return this.toStatus(meta, await this.receivedBytes(uploadId));
    } finally {
      this.writing.delete(uploadId);
    }
  }

  async complete(propertyId: string, uploadId: string): Promise<PropertyMedia> {
    const pending = this.completing.get(uploadId);
    if (pending) {
      // El cliente reintento mientras el video se procesaba: misma respuesta.
      return pending;
    }

    const promise = this.doComplete(propertyId, uploadId).finally(() =>
      this.completing.delete(uploadId),
    );
    this.completing.set(uploadId, promise);
    return promise;
  }

  private async doComplete(propertyId: string, uploadId: string): Promise<PropertyMedia> {
    const meta = await this.readMeta(propertyId, uploadId);

    if (meta.mediaId) {
      // Ya se completo pero la respuesta no llego al telefono.
      const existing = (await this.propertyMediaService.findAllForProperty(propertyId)).find(
        (item) => item.id === meta.mediaId,
      );
      if (existing) {
        return existing;
      }
      throw new NotFoundException('El archivo ya se procesó pero fue eliminado');
    }

    const received = await this.receivedBytes(uploadId);
    if (received !== meta.size) {
      throw new ConflictException({ message: 'Faltan trozos por subir', received });
    }

    const media = await this.propertyMediaService.uploadMedia(
      propertyId,
      {
        originalname: meta.filename,
        mimetype: meta.mimetype,
        size: meta.size,
        path: this.partPath(uploadId),
      },
      meta.type,
    );

    await fs.rm(this.partPath(uploadId), { force: true });
    await this.writeMeta({ ...meta, mediaId: media.id });
    return media;
  }

  private pipeLimited(body: Readable, target: string, limit: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const out = createWriteStream(target, { flags: 'a' });
      let written = 0;
      let failed = false;

      const fail = (error: Error) => {
        if (failed) return;
        failed = true;
        body.unpipe(out);
        body.resume();
        out.end(() => reject(error));
      };

      body.on('data', (chunk: Buffer) => {
        if (failed) return;
        if (written + chunk.length > limit) {
          fail(new PayloadTooLargeException('El trozo es más grande de lo permitido'));
          return;
        }
        written += chunk.length;
        if (!out.write(chunk)) {
          body.pause();
          out.once('drain', () => body.resume());
        }
      });
      let ended = false;
      body.on('end', () => {
        ended = true;
        if (!failed) out.end(() => resolve());
      });
      // Conexion cortada (pantalla apagada, sin cobertura): se conserva lo escrito.
      const interrupted = () => {
        if (!ended) fail(new BadRequestException('La subida del trozo se interrumpió'));
      };
      body.on('aborted', interrupted);
      body.on('close', interrupted);
      body.on('error', (error) => fail(error));
      out.on('error', (error) => fail(error));
    });
  }

  private async receivedBytes(uploadId: string): Promise<number> {
    try {
      return (await fs.stat(this.partPath(uploadId))).size;
    } catch {
      return 0;
    }
  }

  private toStatus(meta: UploadSessionMeta, received: number): UploadSessionStatus {
    return { uploadId: meta.id, received, size: meta.size, chunkSize: UPLOAD_CHUNK_SIZE };
  }

  private async readMeta(propertyId: string, uploadId: string): Promise<UploadSessionMeta> {
    try {
      const meta = JSON.parse(await fs.readFile(this.metaPath(uploadId), 'utf8')) as UploadSessionMeta;
      if (meta.propertyId === propertyId) {
        return meta;
      }
    } catch {
      // Se trata igual que una sesion inexistente.
    }
    throw new NotFoundException('La subida no existe o ya caducó');
  }

  private writeMeta(meta: UploadSessionMeta): Promise<void> {
    return fs.writeFile(this.metaPath(meta.id), JSON.stringify(meta));
  }

  private async removeStaleSessions(): Promise<void> {
    const now = Date.now();
    for (const name of await fs.readdir(this.root)) {
      const filePath = path.join(this.root, name);
      try {
        const { mtimeMs } = await fs.stat(filePath);
        if (now - mtimeMs > SESSION_TTL_MS) {
          await fs.rm(filePath, { force: true });
        }
      } catch {
        // Otro proceso ya lo borro.
      }
    }
  }

  private partPath(uploadId: string): string {
    return path.join(this.root, `${uploadId}.part`);
  }

  private metaPath(uploadId: string): string {
    return path.join(this.root, `${uploadId}.json`);
  }
}
