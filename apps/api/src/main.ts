import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function isLocalDevOrigin(origin: string): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.endsWith('.trycloudflare.com'))
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const origins = (process.env.CORS_ORIGINS ?? process.env.WEB_BASE_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || origins.includes(requestOrigin) || isLocalDevOrigin(requestOrigin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${requestOrigin}`));
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
  const httpServer = app.getHttpServer();
  httpServer.setTimeout(10 * 60 * 1000);
  httpServer.headersTimeout = 11 * 60 * 1000;
  httpServer.requestTimeout = 10 * 60 * 1000;
}
bootstrap();
