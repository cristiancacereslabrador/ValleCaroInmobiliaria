import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo excede el tamaño máximo permitido (100 MB)'
        : 'No se pudo recibir el archivo. Inténtalo de nuevo.';

    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
    });
  }
}
