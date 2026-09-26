// backend/src/rides/rides.module.ts
import { Module } from '@nestjs/common';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { GeoModule } from '../geo/geo.module';
import { FareModule } from '../fare/fare.module';

@Module({
  imports: [GeoModule, FareModule],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
