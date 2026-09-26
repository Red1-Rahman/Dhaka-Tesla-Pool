import { Module } from '@nestjs/common';
import { PoolsController } from './pools.controller';
import { PoolsService } from './pools.service';
import { PrismaService } from '../common/prisma.service';
import { GeoModule } from '../geo/geo.module';
import { FareModule } from '../fare/fare.module';

@Module({
  imports: [GeoModule, FareModule],
  controllers: [PoolsController],
  providers: [PoolsService, PrismaService],
  exports: [PoolsService],
})
export class PoolsModule {}
