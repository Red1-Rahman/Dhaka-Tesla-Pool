import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GeoService } from '../geo/geo.service';
import { FareService } from '../fare/fare.service';
import { assertTransition } from '../common/status-machine';

// Driver-side pooling logic: accepting a ride into a pool, advancing the
// pool through its lifecycle, and enforcing that a vehicle never carries
// more passengers than its capacity. See docs/specs.md for the
// concurrency design this class implements.
@Injectable()
export class PoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly fareService: FareService,
  ) {}

  async accept(driverId: string, rideRequestId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { driverId } });
    if (!vehicle) {
      throw new NotFoundException('You do not have a registered vehicle');
    }
    if (!vehicle.isOnline) {
      throw new ConflictException('Go online before accepting rides');
    }

    const ride = await this.prisma.rideRequest.findUnique({ where: { id: rideRequestId } });
    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }
    assertTransition(ride.status, 'MATCHED');

    return this.prisma.$transaction(async (tx) => {
      // A vehicle carries at most one open pool at a time. Find its id
      // first, this initial read can be stale, that's fine, it's only
      // used to know whether a pool exists at all.
      const existingPool = await tx.pool.findFirst({
        where: { vehicleId: vehicle.id, status: 'MATCHED' },
        select: { id: true },
      });

      let pool: { id: string; rideRequests: { pickupZone: string; seatsRequested: number }[] };

      if (existingPool) {
        // Lock the pool row so a concurrent accept() on the same pool
        // blocks here until this transaction commits or rolls back.
        await tx.$queryRaw`SELECT id FROM "pools" WHERE id = ${existingPool.id} FOR UPDATE`;

        // Re-read membership AFTER the lock is held, not before. The
        // findFirst above and this read can straddle another
        // transaction's commit, so the pre-lock snapshot cannot be
        // trusted for the capacity and compatibility checks below, only
        // this post-lock read reflects every membership already
        // committed by the time we act.
        pool = await tx.pool.findUniqueOrThrow({
          where: { id: existingPool.id },
          select: { id: true, rideRequests: { select: { pickupZone: true, seatsRequested: true } } },
        });

        const compatible = pool.rideRequests.every((member) =>
          this.geoService.pickupZonesCompatible(member.pickupZone, ride.pickupZone),
        );
        if (!compatible) {
          throw new ConflictException(
            "This ride is not compatible with the vehicle's current pool route",
          );
        }

        const seatsTaken = pool.rideRequests.reduce((sum, r) => sum + r.seatsRequested, 0);
        if (seatsTaken + ride.seatsRequested > vehicle.capacity) {
          throw new ConflictException('Vehicle capacity would be exceeded');
        }
      } else {
        // No pool exists yet for this vehicle, nothing to race over,
        // this insert is the first membership by definition.
        const created = await tx.pool.create({
          data: { vehicleId: vehicle.id, status: 'MATCHED' },
          select: { id: true },
        });
        pool = { id: created.id, rideRequests: [] };
      }

      const isPooled = pool.rideRequests.length > 0;
      const distanceKm = this.geoService.distanceKm(
        { lat: ride.pickupLat, lng: ride.pickupLng },
        { lat: ride.dropoffLat, lng: ride.dropoffLng },
      );
      const farePaisa = this.fareService.calculateFare(distanceKm, isPooled);

      const updatedRide = await tx.rideRequest.update({
        where: { id: ride.id },
        data: { status: 'MATCHED', poolId: pool.id, farePaisa },
      });

      await tx.poolMembership.create({
        data: {
          poolId: pool.id,
          rideRequestId: ride.id,
          seatIndex: pool.rideRequests.length,
        },
      });

      await tx.rideStatusHistory.create({
        data: { rideRequestId: ride.id, fromStatus: 'REQUESTED', toStatus: 'MATCHED' },
      });

      return {
        pool_id: pool.id,
        ride_request_id: updatedRide.id,
        status: updatedRide.status,
        seats_taken: pool.rideRequests.length + 1,
        capacity: vehicle.capacity,
      };
    });
  }

  async markDriverArrived(driverId: string, poolId: string) {
    return this.transitionPool(driverId, poolId, 'DRIVER_ARRIVED');
  }

  async start(driverId: string, poolId: string) {
    const pool = await this.getOwnedPoolOrThrow(driverId, poolId);
    if (pool.rideRequests.length === 0) {
      throw new ConflictException('Cannot start a pool with no passengers');
    }
    return this.transitionPool(driverId, poolId, 'STARTED', { startedAt: new Date() });
  }

  async complete(driverId: string, poolId: string) {
    const pool = await this.getOwnedPoolOrThrow(driverId, poolId);
    const result = await this.transitionPool(driverId, poolId, 'COMPLETED', {
      completedAt: new Date(),
    });

    // One Payment row per member, per docs/database-schema.md. Method
    // defaults to cash for the MVP, see payments/payment.service.ts
    // (feature/driver-flow) for where a real method choice gets wired in.
    for (const ride of pool.rideRequests) {
      await this.prisma.payment.create({
        data: {
          rideRequestId: ride.id,
          method: 'cash',
          amountPaisa: ride.farePaisa,
          status: 'completed',
        },
      });
    }

    return result;
  }

  async findByIdForDriver(driverId: string, poolId: string) {
    const pool = await this.getOwnedPoolOrThrow(driverId, poolId);
    return {
      pool_id: pool.id,
      status: pool.status,
      vehicle: { id: pool.vehicle.id, name: pool.vehicle.name, capacity: pool.vehicle.capacity },
      passengers: pool.rideRequests.map((r) => ({
        ride_request_id: r.id,
        passenger_id: r.passengerId,
        pickup_zone: r.pickupZone,
        dropoff_zone: r.dropoffZone,
        seats_requested: r.seatsRequested,
        fare_paisa: r.farePaisa,
        status: r.status,
      })),
    };
  }

  private async getOwnedPoolOrThrow(driverId: string, poolId: string) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      include: { vehicle: true, rideRequests: true },
    });
    if (!pool) {
      throw new NotFoundException('Pool not found');
    }
    if (pool.vehicle.driverId !== driverId) {
      throw new ForbiddenException('This is not your pool');
    }
    return pool;
  }

  private async transitionPool(
    driverId: string,
    poolId: string,
    toStatus: string,
    extraFields: Record<string, unknown> = {},
  ) {
    const pool = await this.getOwnedPoolOrThrow(driverId, poolId);
    assertTransition(pool.status, toStatus);

    return this.prisma.$transaction(async (tx) => {
      await tx.pool.update({ where: { id: poolId }, data: { status: toStatus, ...extraFields } });

      for (const ride of pool.rideRequests) {
        assertTransition(ride.status, toStatus);
        await tx.rideRequest.update({ where: { id: ride.id }, data: { status: toStatus } });
        await tx.rideStatusHistory.create({
          data: { rideRequestId: ride.id, fromStatus: ride.status, toStatus },
        });
      }

      return { pool_id: poolId, status: toStatus, passenger_count: pool.rideRequests.length };
    });
  }
}
