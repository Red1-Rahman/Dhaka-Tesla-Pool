import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() + imported once in AppModule means PrismaService is instantiated
// exactly once for the whole process: one PrismaClient, one connection pool,
// matching the comment on PrismaService itself. Feature modules (auth, users,
// vehicles, rides, pools, payments) should stop listing PrismaService in
// their own `providers` array now that this module supplies it globally —
// the duplicate provider entries in those modules are removed in the same
// PR that lands this file.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
