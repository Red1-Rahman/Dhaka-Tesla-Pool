import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // docs/api-contracts.md and .env.example both assume every route sits
  // under /api/v1 — nothing ever set this before, so routes mounted at root.
  app.setGlobalPrefix('api/v1');

  // The browser app (:3000) calls this API (:3001), which is cross-origin.
  // Without this, the browser blocks the preflight and fetch() throws before
  // any response arrives. Auth uses a Bearer header, not cookies, so
  // `credentials` is intentionally not enabled. CORS_ORIGIN accepts a
  // comma-separated list for multiple origins.
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: allowedOrigins });

  // makes every class-validator decorator on every DTO active, strips fields
  // a DTO doesn't declare, and rejects unknown fields with 400 instead of
  // silently accepting them (audit #1 and the whitelist gap in #14).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // catches raw Prisma errors and anything else Nest's default filter would
  // otherwise leak straight to the client (audit #6, #14).
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port);
}

bootstrap();
// this comment is only to trigger the ci
