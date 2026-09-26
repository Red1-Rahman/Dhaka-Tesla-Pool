import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

// One driver, one vehicle in this MVP (Jashim owns Bullet), see
// docs/database-schema.md. This service only ever touches the caller's
// own vehicle, there is no "list all vehicles" or "get vehicle by id"
// exposed to anyone.
@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async setOnline(driverId: string, isOnline: boolean) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { driverId } });
    if (!vehicle) {
      throw new NotFoundException('You do not have a registered vehicle');
    }

    const updated = await this.prisma.vehicle.update({
      where: { driverId },
      data: { isOnline },
    });

    return {
      id: updated.id,
      name: updated.name,
      capacity: updated.capacity,
      is_online: updated.isOnline,
    };
  }

  async getOwn(driverId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { driverId } });
    if (!vehicle) {
      throw new NotFoundException('You do not have a registered vehicle');
    }
    return {
      id: vehicle.id,
      name: vehicle.name,
      capacity: vehicle.capacity,
      is_online: vehicle.isOnline,
    };
  }
}
