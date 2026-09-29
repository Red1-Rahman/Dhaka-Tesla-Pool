import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GeoService } from '../geo/geo.service';
import { FareService } from '../fare/fare.service';
import { PaymentsService } from '../payments/payments.service';
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
    private readonly paymentsService: PaymentsService,
  ) {}

  async accept(driverId: string, rideRequestId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { driverId },
    });

    if (!vehicle) {
      throw new NotFoundException('You do not have a registered vehicle');
    }

    if (!vehicle.isOnline) {
      throw new ConflictException('Go online before accepting rides');
    }

    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
    });

    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }

    assertTransition(ride.status, 'MATCHED');

    return this.prisma.$transaction(async (tx) => {
      // A vehicle carries at most one open pool at a time. Find its id
      // first; this initial read can be stale, which is fine because it
      // is only used to determine whether a pool exists.
      const existingPool = await tx.pool.findFirst({
        where: {
          vehicleId: vehicle.id,
          status: 'MATCHED',
        },
        select: { id: true },
      });

      let pool: {
        id: string;
        rideRequests: {
          id: string;
          pickupZone: string;
          seatsRequested: number;
          pickupLat: number;
          pickupLng: number;
          dropoffLat: number;
          dropoffLng: number;
        }[];
      };

      if (existingPool) {
        // Lock the pool row so concurrent accepts for the same vehicle
        // serialize their capacity and compatibility checks.
        await tx.$queryRaw`
          SELECT id
          FROM "pools"
          WHERE id = ${existingPool.id}
          FOR UPDATE
        `;

        // Re-read membership after acquiring the lock. This ensures
        // capacity and compatibility checks see memberships committed
        // before this transaction proceeds.
        pool = await tx.pool.findUniqueOrThrow({
          where: { id: existingPool.id },
          select: {
            id: true,
            rideRequests: {
              select: {
                id: true,
                pickupZone: true,
                seatsRequested: true,
                pickupLat: true,
                pickupLng: true,
                dropoffLat: true,
                dropoffLng: true,
              },
            },
          },
        });

        const compatible = pool.rideRequests.every((member) =>
          this.geoService.pickupZonesCompatible(
            member.pickupZone,
            ride.pickupZone,
          ),
        );

        if (!compatible) {
          throw new ConflictException(
            "This ride is not compatible with the vehicle's current pool route",
          );
        }

        const seatsTaken = pool.rideRequests.reduce(
          (sum, member) => sum + member.seatsRequested,
          0,
        );

        if (seatsTaken + ride.seatsRequested > vehicle.capacity) {
          throw new ConflictException(
            'Vehicle capacity would be exceeded',
          );
        }
      } else {
        // No pool exists yet for this vehicle, so this insert is the
        // first membership by definition.
        const created = await tx.pool.create({
          data: {
            vehicleId: vehicle.id,
            status: 'MATCHED',
          },
          select: { id: true },
        });

        pool = {
          id: created.id,
          rideRequests: [],
        };
      }

      const isPooled = pool.rideRequests.length > 0;

      const distanceKm = this.geoService.distanceKm(
        { lat: ride.pickupLat, lng: ride.pickupLng },
        { lat: ride.dropoffLat, lng: ride.dropoffLng },
      );

      const farePaisa = this.fareService.calculateFare(
        distanceKm,
        isPooled,
      );

      const updatedRide = await tx.rideRequest.update({
        where: { id: ride.id },
        data: {
          status: 'MATCHED',
          poolId: pool.id,
          farePaisa,
        },
      });

      await tx.poolMembership.create({
        data: {
          poolId: pool.id,
          rideRequestId: ride.id,
          seatIndex: pool.rideRequests.length,
        },
      });

      // If this ride joined an existing pool, all existing members
      // are now pooled rides as well. Recalculate each member's fare
      // using that member's own route and the pooled fare model.
      if (isPooled) {
        for (const member of pool.rideRequests) {
          const memberDistanceKm = this.geoService.distanceKm(
            { lat: member.pickupLat, lng: member.pickupLng },
            { lat: member.dropoffLat, lng: member.dropoffLng },
          );

          const memberFarePaisa = this.fareService.calculateFare(
            memberDistanceKm,
            true,
          );

          await tx.rideRequest.update({
            where: { id: member.id },
            data: {
              farePaisa: memberFarePaisa,
            },
          });
        }
      }

      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: ride.id,
          fromStatus: 'REQUESTED',
          toStatus: 'MATCHED',
        },
      });

      return {
        poolId: pool.id,
        rideRequestId: updatedRide.id,
        status: updatedRide.status,
        seatsTaken: pool.rideRequests.length + 1,
        capacity: vehicle.capacity,
      };
    });
  }

  async markDriverArrived(driverId: string, poolId: string) {
    return this.transitionPool(
      driverId,
      poolId,
      'DRIVER_ARRIVED',
    );
  }

  async start(driverId: string, poolId: string) {
    const pool = await this.getOwnedPoolOrThrow(
      driverId,
      poolId,
    );

    if (pool.rideRequests.length === 0) {
      throw new ConflictException(
        'Cannot start a pool with no passengers',
      );
    }

    return this.transitionPool(
      driverId,
      poolId,
      'STARTED',
      { startedAt: new Date() },
    );
  }

  async complete(driverId: string, poolId: string) {
    const pool = await this.getOwnedPoolOrThrow(
      driverId,
      poolId,
    );

    const result = await this.transitionPool(
      driverId,
      poolId,
      'COMPLETED',
      { completedAt: new Date() },
    );

    // Cancelled members remain associated with the pool for history,
    // but they must not be charged.
    const activeRides = pool.rideRequests.filter(
      (ride) => ride.status !== 'CANCELLED',
    );

    // One charge per active member, per docs/database-schema.md.
    // Method defaults to cash for the MVP, routed through
    // PaymentsService so a real gateway later only requires changing
    // that one class.
    for (const ride of activeRides) {
      await this.paymentsService.charge({
        rideRequestId: ride.id,
        amountPaisa: ride.farePaisa,
        method: 'cash',
      });
    }

    return result;
  }

  async findByIdForDriver(driverId: string, poolId: string) {
    const pool = await this.getOwnedPoolOrThrow(
      driverId,
      poolId,
    );

    return {
      poolId: pool.id,
      status: pool.status,
      vehicle: {
        id: pool.vehicle.id,
        name: pool.vehicle.name,
        capacity: pool.vehicle.capacity,
      },
      passengers: pool.rideRequests.map((r) => ({
        rideRequestId: r.id,
        passengerId: r.passengerId,
        pickupZone: r.pickupZone,
        dropoffZone: r.dropoffZone,
        seatsRequested: r.seatsRequested,
        farePaisa: r.farePaisa,
        status: r.status,
      })),
    };
  }

  private async getOwnedPoolOrThrow(
    driverId: string,
    poolId: string,
  ) {
    const pool = await this.prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        vehicle: true,
        rideRequests: true,
      },
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
    const pool = await this.getOwnedPoolOrThrow(
      driverId,
      poolId,
    );

    assertTransition(pool.status, toStatus);

    // Cancelled members remain in the pool for historical membership,
    // but they no longer participate in the active lifecycle.
    const activeRides = pool.rideRequests.filter(
      (ride) => ride.status !== 'CANCELLED',
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.pool.update({
        where: { id: poolId },
        data: {
          status: toStatus,
          ...extraFields,
        },
      });

      for (const ride of activeRides) {
        assertTransition(ride.status, toStatus);

        await tx.rideRequest.update({
          where: { id: ride.id },
          data: { status: toStatus },
        });

        await tx.rideStatusHistory.create({
          data: {
            rideRequestId: ride.id,
            fromStatus: ride.status,
            toStatus,
          },
        });
      }

      return {
        poolId,
        status: toStatus,
        passengerCount: activeRides.length,
      };
    });
  }
}
