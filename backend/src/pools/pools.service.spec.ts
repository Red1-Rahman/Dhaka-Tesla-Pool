import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PoolsService } from './pools.service';

describe('PoolsService', () => {
  let service: PoolsService;

  const prisma = {
    vehicle: {
      findUnique: jest.fn(),
    },
    rideRequest: {
      findUnique: jest.fn(),
    },
    pool: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const tx = {
    $queryRaw: jest.fn(),
    pool: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    poolMembership: {
      create: jest.fn(),
    },
    rideRequest: {
      update: jest.fn(),
    },
    rideStatusHistory: {
      create: jest.fn(),
    },
  };

  const geoService = {
    distanceKm: jest.fn(),
    pickupZonesCompatible: jest.fn(),
    dropoffZonesCompatible: jest.fn(),
  };

  const fareService = {
    calculateFare: jest.fn(),
  };

  const paymentsService = {
    charge: jest.fn(),
  };

  const vehicle = {
    id: 'vehicle-1',
    driverId: 'jashim-id',
    name: 'Bullet',
    capacity: 3,
    isOnline: true,
  };

  const makeRide = (
    overrides: Partial<{
      id: string;
      passengerId: string;
      pickupZone: string;
      dropoffZone: string;
      pickupLat: number;
      pickupLng: number;
      dropoffLat: number;
      dropoffLng: number;
      seatsRequested: number;
      status: string;
      farePaisa: number;
    }> = {},
  ) => ({
    id: 'ride-1',
    passengerId: 'passenger-1',
    pickupZone: 'Banani',
    dropoffZone: 'Mohakhali',
    pickupLat: 23.7937,
    pickupLng: 90.4066,
    dropoffLat: 23.7772,
    dropoffLng: 90.3992,
    seatsRequested: 1,
    status: 'MATCHED',
    farePaisa: 1000,
    ...overrides,
  });

  const makePool = (
    overrides: Partial<{
      id: string;
      status: string;
      vehicle: typeof vehicle;
      rideRequests: ReturnType<typeof makeRide>[];
    }> = {},
  ) => ({
    id: 'pool-1',
    status: 'MATCHED',
    vehicle,
    rideRequests: [makeRide()],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    service = new PoolsService(
      prisma as any,
      geoService as any,
      fareService as any,
      paymentsService as any,
    );

    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => unknown) =>
        callback(tx),
    );

    tx.$queryRaw.mockResolvedValue([]);
    tx.pool.findFirst.mockResolvedValue(null);
    tx.pool.findUniqueOrThrow.mockResolvedValue(
      makePool({
        rideRequests: [],
      }),
    );
    tx.pool.create.mockResolvedValue({
      id: 'pool-1',
    });
    tx.pool.update.mockResolvedValue({});
    tx.poolMembership.create.mockResolvedValue({});
    tx.rideRequest.update.mockImplementation(
      async ({ where }: { where: { id: string } }) =>
        makeRide({ id: where.id }),
    );
    tx.rideStatusHistory.create.mockResolvedValue({});

    prisma.vehicle.findUnique.mockResolvedValue(vehicle);
    prisma.rideRequest.findUnique.mockResolvedValue(
      makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
      }),
    );
    prisma.pool.findUnique.mockResolvedValue(makePool());

    geoService.distanceKm.mockReturnValue(5);
    geoService.pickupZonesCompatible.mockReturnValue(true);
    geoService.dropoffZonesCompatible.mockReturnValue(true);

    fareService.calculateFare.mockReturnValue(1000);

    paymentsService.charge.mockResolvedValue({});
  });

  describe('accept', () => {
    it('rejects when the driver has no registered vehicle', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.rideRequest.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects when the vehicle is offline', async () => {
      prisma.vehicle.findUnique.mockResolvedValue({
        ...vehicle,
        isOnline: false,
      });

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.rideRequest.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects when the ride does not exist', async () => {
      prisma.rideRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a ride that cannot transition to MATCHED', async () => {
      prisma.rideRequest.findUnique.mockResolvedValue(
        makeRide({
          id: 'ride-new',
          status: 'CANCELLED',
        }),
      );

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('creates a new pool when the driver has no active matched pool', async () => {
      const newRide = makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
        farePaisa: 0,
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue(null);
      tx.pool.create.mockResolvedValue({
        id: 'pool-1',
      });

      tx.rideRequest.update.mockResolvedValue({
        ...newRide,
        status: 'MATCHED',
        poolId: 'pool-1',
        farePaisa: 1000,
      });

      geoService.distanceKm.mockReturnValue(5);
      fareService.calculateFare.mockReturnValue(1000);

      const result = await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(tx.pool.create).toHaveBeenCalledWith({
        data: {
          vehicleId: vehicle.id,
          status: 'MATCHED',
        },
        select: {
          id: true,
        },
      });

      expect(tx.poolMembership.create).toHaveBeenCalledWith({
        data: {
          poolId: 'pool-1',
          rideRequestId: 'ride-new',
          seatIndex: 0,
        },
      });

      expect(tx.rideRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'ride-new',
        },
        data: {
          status: 'MATCHED',
          poolId: 'pool-1',
          farePaisa: 1000,
        },
      });

      expect(fareService.calculateFare).toHaveBeenCalledWith(
        5,
        false,
      );

      expect(tx.rideStatusHistory.create).toHaveBeenCalledWith({
        data: {
          rideRequestId: 'ride-new',
          fromStatus: 'REQUESTED',
          toStatus: 'MATCHED',
        },
      });

      expect(result).toEqual({
        poolId: 'pool-1',
        rideRequestId: 'ride-new',
        status: 'MATCHED',
        seatsTaken: 1,
        capacity: 3,
      });
    });

    it('accepts a ride into an existing pool', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        status: 'MATCHED',
        seatsRequested: 1,
      });

      const newRide = makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
        seatsRequested: 1,
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      tx.rideRequest.update.mockImplementation(
        async ({ where }: { where: { id: string } }) => {
          if (where.id === newRide.id) {
            return {
              ...newRide,
              status: 'MATCHED',
              poolId: 'pool-1',
              farePaisa: 800,
            };
          }

          return {
            ...existingRide,
            farePaisa: 800,
          };
        },
      );

      fareService.calculateFare.mockReturnValue(800);

      const result = await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(tx.$queryRaw).toHaveBeenCalled();

      expect(tx.pool.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {
          id: 'pool-1',
        },
        select: {
          id: true,
          rideRequests: {
            select: {
              id: true,
              pickupZone: true,
              dropoffZone: true,
              seatsRequested: true,
              pickupLat: true,
              pickupLng: true,
              dropoffLat: true,
              dropoffLng: true,
            },
          },
        },
      });

      expect(tx.pool.create).not.toHaveBeenCalled();

      expect(tx.poolMembership.create).toHaveBeenCalledWith({
        data: {
          poolId: 'pool-1',
          rideRequestId: 'ride-new',
          seatIndex: 1,
        },
      });

      expect(result).toEqual({
        poolId: 'pool-1',
        rideRequestId: 'ride-new',
        status: 'MATCHED',
        seatsTaken: 2,
        capacity: 3,
      });
    });

    it('rejects a ride when total requested seats would exceed capacity', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        seatsRequested: 2,
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        seatsRequested: 2,
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow('Vehicle capacity would be exceeded');

      expect(tx.rideRequest.update).not.toHaveBeenCalled();
      expect(tx.poolMembership.create).not.toHaveBeenCalled();
    });

    it('allows a ride when total requested seats exactly equal capacity', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        seatsRequested: 2,
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        seatsRequested: 1,
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      tx.rideRequest.update.mockImplementation(
        async ({ where }: { where: { id: string } }) => {
          if (where.id === newRide.id) {
            return {
              ...newRide,
              status: 'MATCHED',
              poolId: 'pool-1',
              farePaisa: 800,
            };
          }

          return {
            ...existingRide,
            status: 'MATCHED',
            poolId: 'pool-1',
            farePaisa: 700,
          };
        },
      );

      fareService.calculateFare
        .mockReturnValueOnce(800)
        .mockReturnValueOnce(700);

      const result = await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(result).toEqual({
        poolId: 'pool-1',
        rideRequestId: 'ride-new',
        status: 'MATCHED',
        seatsTaken: 3,
        capacity: 3,
      });

      expect(tx.poolMembership.create).toHaveBeenCalledWith({
        data: {
          poolId: 'pool-1',
          rideRequestId: 'ride-new',
          seatIndex: 1,
        },
      });
    });

    it('rejects an incompatible pickup zone', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        pickupZone: 'Banani',
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        pickupZone: 'Mirpur',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      geoService.pickupZonesCompatible.mockReturnValue(false);

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(
        "This ride is not compatible with the vehicle's current pool pickup route",
      );

      expect(
        geoService.pickupZonesCompatible,
      ).toHaveBeenCalledWith(
        'Banani',
        'Mirpur',
      );

      expect(tx.rideRequest.update).not.toHaveBeenCalled();
      expect(tx.poolMembership.create).not.toHaveBeenCalled();
    });

    it('rejects an incompatible dropoff zone', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        dropoffZone: 'Mohakhali',
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        dropoffZone: 'Dhanmondi',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      geoService.pickupZonesCompatible.mockReturnValue(true);
      geoService.dropoffZonesCompatible.mockReturnValue(false);

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(
        "This ride is not compatible with the vehicle's current pool dropoff route",
      );

      expect(
        geoService.dropoffZonesCompatible,
      ).toHaveBeenCalledWith(
        'Mohakhali',
        'Dhanmondi',
      );

      expect(tx.rideRequest.update).not.toHaveBeenCalled();
      expect(tx.poolMembership.create).not.toHaveBeenCalled();
    });

    it('checks pickup compatibility against every existing pool member', async () => {
      const firstRide = makeRide({
        id: 'ride-1',
        pickupZone: 'Banani',
        status: 'MATCHED',
      });

      const secondRide = makeRide({
        id: 'ride-2',
        pickupZone: 'Gulshan',
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        pickupZone: 'Mirpur',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [firstRide, secondRide],
      });

      geoService.pickupZonesCompatible.mockImplementation(
        (zoneA: string) => zoneA === 'Banani',
      );

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(ConflictException);

      expect(
        geoService.pickupZonesCompatible,
      ).toHaveBeenCalledTimes(2);

      expect(
        geoService.pickupZonesCompatible,
      ).toHaveBeenNthCalledWith(
        1,
        'Banani',
        'Mirpur',
      );

      expect(
        geoService.pickupZonesCompatible,
      ).toHaveBeenNthCalledWith(
        2,
        'Gulshan',
        'Mirpur',
      );
    });

    it('checks dropoff compatibility against every existing pool member', async () => {
      const firstRide = makeRide({
        id: 'ride-1',
        dropoffZone: 'Mohakhali',
        status: 'MATCHED',
      });

      const secondRide = makeRide({
        id: 'ride-2',
        dropoffZone: 'Gulshan',
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        dropoffZone: 'Dhanmondi',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [firstRide, secondRide],
      });

      geoService.pickupZonesCompatible.mockReturnValue(true);

      geoService.dropoffZonesCompatible.mockImplementation(
        (zoneA: string) => zoneA === 'Mohakhali',
      );

      await expect(
        service.accept('jashim-id', 'ride-new'),
      ).rejects.toThrow(ConflictException);

      expect(
        geoService.dropoffZonesCompatible,
      ).toHaveBeenCalledTimes(2);

      expect(
        geoService.dropoffZonesCompatible,
      ).toHaveBeenNthCalledWith(
        1,
        'Mohakhali',
        'Dhanmondi',
      );

      expect(
        geoService.dropoffZonesCompatible,
      ).toHaveBeenNthCalledWith(
        2,
        'Gulshan',
        'Dhanmondi',
      );
    });

    it('calculates a non-pooled fare for the first passenger', async () => {
      const newRide = makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue(null);
      tx.pool.create.mockResolvedValue({
        id: 'pool-1',
      });

      geoService.distanceKm.mockReturnValue(7.5);
      fareService.calculateFare.mockReturnValue(1500);

      tx.rideRequest.update.mockResolvedValue({
        ...newRide,
        status: 'MATCHED',
        poolId: 'pool-1',
        farePaisa: 1500,
      });

      await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(geoService.distanceKm).toHaveBeenCalledWith(
        {
          lat: newRide.pickupLat,
          lng: newRide.pickupLng,
        },
        {
          lat: newRide.dropoffLat,
          lng: newRide.dropoffLng,
        },
      );

      expect(
        fareService.calculateFare,
      ).toHaveBeenCalledWith(
        7.5,
        false,
      );
    });

    it('calculates a pooled fare for a newly accepted passenger', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      geoService.distanceKm
        .mockReturnValueOnce(7.5)
        .mockReturnValueOnce(5);

      fareService.calculateFare
        .mockReturnValueOnce(900)
        .mockReturnValueOnce(700);

      tx.rideRequest.update.mockImplementation(
        async ({ where }: { where: { id: string } }) => {
          if (where.id === newRide.id) {
            return {
              ...newRide,
              status: 'MATCHED',
              poolId: 'pool-1',
              farePaisa: 900,
            };
          }

          return {
            ...existingRide,
            farePaisa: 700,
          };
        },
      );

      await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(
        fareService.calculateFare,
      ).toHaveBeenNthCalledWith(
        1,
        7.5,
        true,
      );
    });

    it('recalculates pooled fares for existing members using their own routes', async () => {
      const existingRide = makeRide({
        id: 'ride-1',
        pickupLat: 23.79,
        pickupLng: 90.40,
        dropoffLat: 23.78,
        dropoffLng: 90.42,
        status: 'MATCHED',
      });

      const newRide = makeRide({
        id: 'ride-new',
        pickupLat: 23.80,
        pickupLng: 90.41,
        dropoffLat: 23.76,
        dropoffLng: 90.39,
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: [existingRide],
      });

      geoService.distanceKm
        .mockReturnValueOnce(8)
        .mockReturnValueOnce(4);

      fareService.calculateFare
        .mockReturnValueOnce(1500)
        .mockReturnValueOnce(900);

      tx.rideRequest.update.mockImplementation(
        async ({ where }: { where: { id: string } }) => {
          if (where.id === newRide.id) {
            return {
              ...newRide,
              status: 'MATCHED',
              poolId: 'pool-1',
              farePaisa: 1500,
            };
          }

          return {
            ...existingRide,
            farePaisa: 900,
          };
        },
      );

      await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(
        fareService.calculateFare,
      ).toHaveBeenNthCalledWith(
        1,
        8,
        true,
      );

      expect(
        fareService.calculateFare,
      ).toHaveBeenNthCalledWith(
        2,
        4,
        true,
      );

      expect(tx.rideRequest.update).toHaveBeenNthCalledWith(
        1,
        {
          where: {
            id: newRide.id,
          },
          data: {
            status: 'MATCHED',
            poolId: 'pool-1',
            farePaisa: 1500,
          },
        },
      );

      expect(tx.rideRequest.update).toHaveBeenNthCalledWith(
        2,
        {
          where: {
            id: existingRide.id,
          },
          data: {
            farePaisa: 900,
          },
        },
      );
    });

    it('creates membership at the next available seat index', async () => {
      const existingRides = [
        makeRide({
          id: 'ride-1',
          status: 'MATCHED',
        }),
        makeRide({
          id: 'ride-2',
          passengerId: 'passenger-2',
          status: 'MATCHED',
        }),
      ];

      const newRide = makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue({
        id: 'pool-1',
      });

      tx.pool.findUniqueOrThrow.mockResolvedValue({
        id: 'pool-1',
        rideRequests: existingRides,
      });

      tx.rideRequest.update.mockImplementation(
        async ({ where }: { where: { id: string } }) =>
          makeRide({
            id: where.id,
            status: 'MATCHED',
          }),
      );

      const result = await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(tx.poolMembership.create).toHaveBeenCalledWith({
        data: {
          poolId: 'pool-1',
          rideRequestId: 'ride-new',
          seatIndex: 2,
        },
      });

      expect(result.seatsTaken).toBe(3);
    });

    it('records the ride status transition when accepted', async () => {
      const newRide = makeRide({
        id: 'ride-new',
        status: 'REQUESTED',
      });

      prisma.rideRequest.findUnique.mockResolvedValue(newRide);

      tx.pool.findFirst.mockResolvedValue(null);
      tx.pool.create.mockResolvedValue({
        id: 'pool-1',
      });

      tx.rideRequest.update.mockResolvedValue({
        ...newRide,
        status: 'MATCHED',
        poolId: 'pool-1',
      });

      await service.accept(
        'jashim-id',
        'ride-new',
      );

      expect(tx.rideStatusHistory.create).toHaveBeenCalledWith({
        data: {
          rideRequestId: 'ride-new',
          fromStatus: 'REQUESTED',
          toStatus: 'MATCHED',
        },
      });
    });
  });

  describe('markDriverArrived', () => {
    it('transitions an owned matched pool to DRIVER_ARRIVED', async () => {
      const pool = makePool({
        status: 'MATCHED',
        rideRequests: [
          makeRide({
            status: 'MATCHED',
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      const result = await service.markDriverArrived(
        'jashim-id',
        'pool-1',
      );

      expect(tx.pool.update).toHaveBeenCalledWith({
        where: {
          id: 'pool-1',
        },
        data: {
          status: 'DRIVER_ARRIVED',
        },
      });

      expect(tx.rideRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'ride-1',
        },
        data: {
          status: 'DRIVER_ARRIVED',
        },
      });

      expect(
        tx.rideStatusHistory.create,
      ).toHaveBeenCalledWith({
        data: {
          rideRequestId: 'ride-1',
          fromStatus: 'MATCHED',
          toStatus: 'DRIVER_ARRIVED',
        },
      });

      expect(result).toEqual({
        poolId: 'pool-1',
        status: 'DRIVER_ARRIVED',
        passengerCount: 1,
      });
    });

    it('rejects a pool owned by another driver', async () => {
      prisma.pool.findUnique.mockResolvedValue(
        makePool({
          vehicle: {
            ...vehicle,
            driverId: 'another-driver',
          },
        }),
      );

      await expect(
        service.markDriverArrived(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a missing pool', async () => {
      prisma.pool.findUnique.mockResolvedValue(null);

      await expect(
        service.markDriverArrived(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an invalid pool transition', async () => {
      prisma.pool.findUnique.mockResolvedValue(
        makePool({
          status: 'COMPLETED',
        }),
      );

      await expect(
        service.markDriverArrived(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    it('transitions DRIVER_ARRIVED rides to STARTED', async () => {
      const pool = makePool({
        status: 'DRIVER_ARRIVED',
        rideRequests: [
          makeRide({
            status: 'DRIVER_ARRIVED',
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      const result = await service.start(
        'jashim-id',
        'pool-1',
      );

      expect(tx.pool.update).toHaveBeenCalledWith({
        where: {
          id: 'pool-1',
        },
        data: expect.objectContaining({
          status: 'STARTED',
          startedAt: expect.any(Date),
        }),
      });

      expect(tx.rideRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'ride-1',
        },
        data: {
          status: 'STARTED',
        },
      });

      expect(
        tx.rideStatusHistory.create,
      ).toHaveBeenCalledWith({
        data: {
          rideRequestId: 'ride-1',
          fromStatus: 'DRIVER_ARRIVED',
          toStatus: 'STARTED',
        },
      });

      expect(result).toEqual({
        poolId: 'pool-1',
        status: 'STARTED',
        passengerCount: 1,
      });
    });

    it('does not start an empty pool', async () => {
      const pool = makePool({
        status: 'DRIVER_ARRIVED',
        rideRequests: [],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      await expect(
        service.start(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(
        'Cannot start a pool with no passengers',
      );

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects starting a pool in an invalid state', async () => {
      const pool = makePool({
        status: 'MATCHED',
        rideRequests: [
          makeRide({
            status: 'MATCHED',
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      await expect(
        service.start(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('completes active rides and charges each passenger individually', async () => {
      const pool = makePool({
        status: 'STARTED',
        rideRequests: [
          makeRide({
            id: 'ride-1',
            passengerId: 'passenger-1',
            status: 'STARTED',
            farePaisa: 1000,
          }),
          makeRide({
            id: 'ride-2',
            passengerId: 'passenger-2',
            status: 'STARTED',
            farePaisa: 900,
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      const result = await service.complete(
        'jashim-id',
        'pool-1',
      );

      expect(tx.pool.update).toHaveBeenCalledWith({
        where: {
          id: 'pool-1',
        },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });

      expect(tx.rideRequest.update).toHaveBeenCalledTimes(2);

      expect(
        tx.rideStatusHistory.create,
      ).toHaveBeenCalledTimes(2);

      expect(
        paymentsService.charge,
      ).toHaveBeenCalledTimes(2);

      expect(
        paymentsService.charge,
      ).toHaveBeenNthCalledWith(
        1,
        {
          rideRequestId: 'ride-1',
          amountPaisa: 1000,
          method: 'cash',
        },
      );

      expect(
        paymentsService.charge,
      ).toHaveBeenNthCalledWith(
        2,
        {
          rideRequestId: 'ride-2',
          amountPaisa: 900,
          method: 'cash',
        },
      );

      expect(result).toEqual({
        poolId: 'pool-1',
        status: 'COMPLETED',
        passengerCount: 2,
      });
    });

    it('does not charge a cancelled passenger', async () => {
      const pool = makePool({
        status: 'STARTED',
        rideRequests: [
          makeRide({
            id: 'ride-active',
            passengerId: 'passenger-1',
            status: 'STARTED',
            farePaisa: 1000,
          }),
          makeRide({
            id: 'ride-cancelled',
            passengerId: 'passenger-2',
            status: 'CANCELLED',
            farePaisa: 1200,
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      const result = await service.complete(
        'jashim-id',
        'pool-1',
      );

      expect(result).toEqual({
        poolId: 'pool-1',
        status: 'COMPLETED',
        passengerCount: 1,
      });

      expect(tx.rideRequest.update).toHaveBeenCalledTimes(1);

      expect(tx.rideRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'ride-active',
        },
        data: {
          status: 'COMPLETED',
        },
      });

      expect(
        paymentsService.charge,
      ).toHaveBeenCalledTimes(1);

      expect(
        paymentsService.charge,
      ).toHaveBeenCalledWith({
        rideRequestId: 'ride-active',
        amountPaisa: 1000,
        method: 'cash',
      });

      expect(
        paymentsService.charge,
      ).not.toHaveBeenCalledWith(
        expect.objectContaining({
          rideRequestId: 'ride-cancelled',
        }),
      );
    });

    it('does not let a cancelled pool member block completion', async () => {
      const pool = makePool({
        status: 'STARTED',
        rideRequests: [
          makeRide({
            id: 'ride-active',
            passengerId: 'passenger-1',
            status: 'STARTED',
            farePaisa: 1000,
          }),
          makeRide({
            id: 'ride-cancelled',
            passengerId: 'passenger-2',
            status: 'CANCELLED',
            farePaisa: 900,
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      await expect(
        service.complete(
          'jashim-id',
          'pool-1',
        ),
      ).resolves.toEqual({
        poolId: 'pool-1',
        status: 'COMPLETED',
        passengerCount: 1,
      });

      expect(tx.pool.update).toHaveBeenCalledWith({
        where: {
          id: 'pool-1',
        },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });

      expect(tx.rideRequest.update).toHaveBeenCalledTimes(1);

      expect(tx.rideRequest.update).toHaveBeenCalledWith({
        where: {
          id: 'ride-active',
        },
        data: {
          status: 'COMPLETED',
        },
      });

      expect(
        paymentsService.charge,
      ).toHaveBeenCalledTimes(1);
    });

    it('rejects completion when the pool is not STARTED', async () => {
      const pool = makePool({
        status: 'MATCHED',
        rideRequests: [
          makeRide({
            status: 'MATCHED',
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      await expect(
        service.complete(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(
        paymentsService.charge,
      ).not.toHaveBeenCalled();
    });

    it('rejects completion when an active ride is not STARTED', async () => {
      const pool = makePool({
        status: 'STARTED',
        rideRequests: [
          makeRide({
            status: 'MATCHED',
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      await expect(
        service.complete(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(
        paymentsService.charge,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findByIdForDriver', () => {
    it('returns the owned pool and passenger details', async () => {
      const pool = makePool({
        status: 'STARTED',
        vehicle: {
          ...vehicle,
          name: 'Bullet',
          capacity: 3,
        },
        rideRequests: [
          makeRide({
            id: 'ride-1',
            passengerId: 'passenger-1',
            pickupZone: 'Banani',
            dropoffZone: 'Mohakhali',
            seatsRequested: 1,
            farePaisa: 1000,
            status: 'STARTED',
          }),
          makeRide({
            id: 'ride-2',
            passengerId: 'passenger-2',
            pickupZone: 'Gulshan',
            dropoffZone: 'Mohakhali',
            seatsRequested: 1,
            farePaisa: 900,
            status: 'STARTED',
          }),
        ],
      });

      prisma.pool.findUnique.mockResolvedValue(pool);

      const result = await service.findByIdForDriver(
        'jashim-id',
        'pool-1',
      );

      expect(result).toEqual({
        poolId: 'pool-1',
        status: 'STARTED',
        vehicle: {
          id: 'vehicle-1',
          name: 'Bullet',
          capacity: 3,
        },
        passengers: [
          {
            rideRequestId: 'ride-1',
            passengerId: 'passenger-1',
            pickupZone: 'Banani',
            dropoffZone: 'Mohakhali',
            seatsRequested: 1,
            farePaisa: 1000,
            status: 'STARTED',
          },
          {
            rideRequestId: 'ride-2',
            passengerId: 'passenger-2',
            pickupZone: 'Gulshan',
            dropoffZone: 'Mohakhali',
            seatsRequested: 1,
            farePaisa: 900,
            status: 'STARTED',
          },
        ],
      });
    });

    it('rejects a missing pool', async () => {
      prisma.pool.findUnique.mockResolvedValue(null);

      await expect(
        service.findByIdForDriver(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects another driver from viewing the pool', async () => {
      prisma.pool.findUnique.mockResolvedValue(
        makePool({
          vehicle: {
            ...vehicle,
            driverId: 'another-driver',
          },
        }),
      );

      await expect(
        service.findByIdForDriver(
          'jashim-id',
          'pool-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
