import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Wraps PrismaClient so it can be injected like any other NestJS provider
// (constructor injection into a service), and connects/disconnects along
// with the module lifecycle instead of being managed by hand. Every
// service in src/*/*.service.ts depends on this instead of importing
// PrismaClient directly, so there is exactly one connection to reason about.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
