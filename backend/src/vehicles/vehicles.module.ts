import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '../common/prisma.service';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, PrismaService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
