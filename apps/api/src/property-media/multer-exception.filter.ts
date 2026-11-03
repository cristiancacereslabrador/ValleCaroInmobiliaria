import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

/** Cota maxima de subida: el limite de video (MEDIA_MAX_VIDEO_SIZE_MB, 500 MB por defecto). */
export function maxUploadSizeMb(): number {
  const configured = Number(process.env.MEDIA_MAX_VIDEO_SIZE_MB);
  return Number.isFinite(configured) && configured > 0 ? configured : 500;
}

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? `El archivo excede el tamaño máximo permitido (${maxUploadSizeMb()} MB)`
        : 'No se pudo recibir el archivo. Inténtalo de nuevo.';

    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
    });
  }
}
