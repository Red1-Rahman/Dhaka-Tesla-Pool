import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GeoService } from '../geo/geo.service';
import { FareService } from '../fare/fare.service';
import { assertTransition } from '../common/status-machine';
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
    if (dto.pickupZone === dto.dropoffZone) {
      throw new BadRequestException(
        'Pickup and destination must be different zones',
      );
    }

    // Coordinates come from the server's zone table, never from the client.
    const pickup = ZONES[dto.pickupZone];
    const dropoff = ZONES[dto.dropoffZone];

    const distanceKm = this.geoService.distanceKm(
      { lat: pickup.lat, lng: pickup.lng },
      { lat: dropoff.lat, lng: dropoff.lng },
    );

    // Not pooled at creation time, a fare is quoted solo and only
    // recalculated as pooled once PoolsService actually matches this
    // request with another rider.
    const farePaisa = this.fareService.calculateFare(
      distanceKm,
      false,
    );

    const ride = await this.prisma.rideRequest.create({
      data: {
        passengerId,
        pickupZone: pickup.name,
        dropoffZone: dropoff.name,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        seatsRequested: dto.seatsRequested,
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

  async findOwnRideById(
    passengerId: string,
    rideId: string,
  ) {
    const ride = await this.findByIdOrThrow(rideId);

    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException(
        "You cannot view another passenger's ride",
      );
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

  // Deliberately simple for the one-driver MVP: every unmatched
  // REQUESTED ride is visible to the driver. Actual pickup/dropoff
  // compatibility and vehicle capacity are enforced atomically by
  // PoolsService.accept(), where the driver's vehicle and current
  // pool are available.
  async findAvailableForDrivers() {
    const rides = await this.prisma.rideRequest.findMany({
      where: {
        status: 'REQUESTED',
        poolId: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rides.map((ride) => ({
      id: ride.id,
      pickupZone: ride.pickupZone,
      dropoffZone: ride.dropoffZone,
      seatsRequested: ride.seatsRequested,
      farePaisa: ride.farePaisa,
      createdAt: ride.createdAt,
    }));
  }

  async cancel(
    passengerId: string,
    rideId: string,
    dto: CancelRideDto,
  ) {
    const ride = await this.findByIdOrThrow(rideId);

    if (ride.passengerId !== passengerId) {
      throw new ForbiddenException(
        "You cannot cancel another passenger's ride",
      );
    }

    // Now that pooling exists, MATCHED rides can also be cancelled, per
    // the transition table in docs/api-contracts.md. Throws 409 for any
    // other status via the shared status machine.
    assertTransition(ride.status, 'CANCELLED');

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
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new NotFoundException(
        'Ride request not found',
      );
    }

    return ride;
  }

  // Shapes the HTTP response using the API's camelCase convention.
  // Internal Prisma field names are already camelCase, while PostgreSQL
  // snake_case naming remains isolated behind Prisma @map(...) mappings.
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
      farePaisa: ride.farePaisa,
      poolId: ride.poolId,
      createdAt: ride.createdAt,
      ...(cancelReason ? { cancelReason } : {}),
    };
  }
}
