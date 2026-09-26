import { ForbiddenException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GeoService } from '../geo/geo.service';
import { FareService } from '../fare/fare.service';
import { ZONES } from '../geo/zones.data';
import { CreateRideDto } from './dto/create-ride.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';

// Business logic for a passenger's ride request, from creation through
// cancellation. Pool matching and driver-side transitions belong to
// PoolsService (feature/tesla-pooling), not here, this file only owns
// what a passenger can see and do about their own request.
@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly fareService: FareService,
  ) {}

  async create(passengerId: string, dto: CreateRideDto) {
    const pickup = ZONES[dto.pickup_zone];
    const dropoff = ZONES[dto.dropoff_zone];

    const distanceKm = this.geoService.distanceKm(
      { lat: dto.pickup_lat, lng: dto.pickup_lng },
      { lat: dto.dropoff_lat, lng: dto.dropoff_lng },
    );

    // Not pooled at creation time, a fare is quoted solo and only
    // recalculated as pooled once PoolsService actually matches this
    // request with another rider.
    const farePaisa = this.fareService.calculateFare(distanceKm, false);

    const ride = await this.prisma.rideRequest.create({
      data: {
        passengerId,
        pickupZone: pickup.name,
        dropoffZone: dropoff.name,
        pickupLat: dto.pickup_lat,
        pickupLng: dto.pickup_lng,
        dropoffLat: dto.dropoff_lat,
        dropoffLng: dto.dropoff_lng,
        seatsRequested: dto.seats_requested,
        farePaisa,
        status: 'REQUESTED',
      },
    });

    await this.prisma.rideStatusHistory.create({
      data: {
        rideRequestId: ride.id,
        fromStatus: 'NONE',
        toStatus: 'REQUESTED',
      },
    });

    return this.toResponse(ride);
  }

  async findOwnRideById(passengerId: string, rideId: string) {
    const ride = await this.findByIdOrThrow(rideId);
    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException("You cannot view another passenger's ride");
    }
    return this.toResponse(ride);
  }

  async findOwnRides(passengerId: string) {
    const rides = await this.prisma.rideRequest.findMany({
      where: { passengerId },
      orderBy: { createdAt: 'desc' },
    });
    return rides.map((ride) => this.toResponse(ride));
  }

  async cancel(passengerId: string, rideId: string, dto: CancelRideDto) {
    const ride = await this.findByIdOrThrow(rideId);
    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException("You cannot cancel another passenger's ride");
    }

    // Only REQUESTED is reachable from this branch's scope. Once pooling
    // lands, this check moves to the shared status-machine.ts so MATCHED
    // rides can also be cancelled, per docs/specs.md's lifecycle.
    if (ride.status !== 'REQUESTED') {
      throw new ConflictException(`Cannot cancel a ride in status ${ride.status}`);
    }

    const updated = await this.prisma.rideRequest.update({
      where: { id: rideId },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.rideStatusHistory.create({
      data: {
        rideRequestId: rideId,
        fromStatus: ride.status,
        toStatus: 'CANCELLED',
      },
    });

    return this.toResponse(updated, dto.reason);
  }

  private async findByIdOrThrow(rideId: string) {
    const ride = await this.prisma.rideRequest.findUnique({ where: { id: rideId } });
    if (!ride) {
      throw new NotFoundException('Ride request not found');
    }
    return ride;
  }

  // Shapes the response per docs/api-contracts.md, keeps internal field
  // names (poolId, farePaisa) from leaking implementation detail changes
  // straight into the API surface unchecked.
  private toResponse(
    ride: {
      id: string;
      status: string;
      farePaisa: number;
      poolId: string | null;
      createdAt: Date;
    },
    cancelReason?: string,
  ) {
    return {
      id: ride.id,
      status: ride.status,
      fare_paisa: ride.farePaisa,
      pool_id: ride.poolId,
      created_at: ride.createdAt,
      ...(cancelReason ? { cancel_reason: cancelReason } : {}),
    };
  }
}
