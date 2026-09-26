import { Module } from '@nestjs/common';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { PrismaService } from '../common/prisma.service';
import { GeoModule } from '../geo/geo.module';
import { FareModule } from '../fare/fare.module';

@Module({
  imports: [GeoModule, FareModule],
  controllers: [RidesController],
  providers: [RidesService, PrismaService],
  exports: [RidesService],
})
export class RidesModule {}
