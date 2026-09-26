import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // docs/api-contracts.md and .env.example both assume every route sits
  // under /api/v1 — nothing ever set this before, so routes mounted at root.
  app.setGlobalPrefix('api/v1');

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
