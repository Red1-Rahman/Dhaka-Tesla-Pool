import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { RidesService } from './rides.service';

describe('RidesService', () => {
  let service: RidesService;

  const prisma = {
    rideRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    rideStatusHistory: {
      create: jest.fn(),
    },
  };

  const geoService = {
    distanceKm: jest.fn(),
  };

  const fareService = {
    calculateFare: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new RidesService(
      prisma as any,
      geoService as any,
      fareService as any,
    );
  });

  describe('create', () => {
    it('rejects a ride with the same pickup and destination', async () => {
      await expect(
        service.create('nusrat-id', {
          pickupZone: 'Banani',
          dropoffZone: 'Banani',
          seatsRequested: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        prisma.rideRequest.create,
      ).not.toHaveBeenCalled();
    });

    it('creates a ride with a server-calculated solo fare', async () => {
      geoService.distanceKm.mockReturnValue(5.5);
      fareService.calculateFare.mockReturnValue(3000);

      const ride = {
        id: 'ride-nusrat',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: new Date(),
      };

      prisma.rideRequest.create.mockResolvedValue(ride);
      prisma.rideStatusHistory.create.mockResolvedValue({});

      const result = await service.create('nusrat-id', {
        pickupZone: 'Banani',
        dropoffZone: 'Mohakhali',
        seatsRequested: 1,
      });

      expect(
        fareService.calculateFare,
      ).toHaveBeenCalledWith(5.5, false);

      expect(
        prisma.rideRequest.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            passengerId: 'nusrat-id',
            pickupZone: 'Banani',
            dropoffZone: 'Mohakhali',
            seatsRequested: 1,
            farePaisa: 3000,
            status: 'REQUESTED',
          }),
        }),
      );

      expect(
        prisma.rideStatusHistory.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rideRequestId: 'ride-nusrat',
            fromStatus: 'NONE',
            toStatus: 'REQUESTED',
          }),
        }),
      );

      expect(result).toEqual({
        id: 'ride-nusrat',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: ride.createdAt,
      });
    });
  });

  describe('findOwnRideById', () => {
    it("does not allow a passenger to view another passenger's ride", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-r',
        passengerId: 'rafiq-id',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: new Date(),
      });

      await expect(
        service.findOwnRideById(
          'nusrat-id',
          'ride-r',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns the passenger own ride', async () => {
      const ride = {
        id: 'ride-n',
        passengerId: 'nusrat-id',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: new Date(),
      };

      prisma.rideRequest.findUnique.mockResolvedValue(ride);

      await expect(
        service.findOwnRideById(
          'nusrat-id',
          'ride-n',
        ),
      ).resolves.toEqual({
        id: 'ride-n',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: ride.createdAt,
      });
    });

    it('returns not found for a missing ride', async () => {
      prisma.rideRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.findOwnRideById(
          'nusrat-id',
          'missing',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('allows a passenger to cancel a requested ride', async () => {
      const ride = {
        id: 'ride-n',
        passengerId: 'nusrat-id',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: new Date(),
      };

      const cancelled = {
        ...ride,
        status: 'CANCELLED',
      };

      prisma.rideRequest.findUnique.mockResolvedValue(ride);
      prisma.rideRequest.update.mockResolvedValue(cancelled);
      prisma.rideStatusHistory.create.mockResolvedValue({});

      const result = await service.cancel(
        'nusrat-id',
        'ride-n',
        { reason: 'Plans changed' },
      );

      expect(
        prisma.rideRequest.update,
      ).toHaveBeenCalledWith({
        where: { id: 'ride-n' },
        data: { status: 'CANCELLED' },
      });

      expect(
        prisma.rideStatusHistory.create,
      ).toHaveBeenCalledWith({
        data: {
          rideRequestId: 'ride-n',
          fromStatus: 'REQUESTED',
          toStatus: 'CANCELLED',
        },
      });

      expect(result.status).toBe('CANCELLED');
      expect(result.cancelReason).toBe(
        'Plans changed',
      );
    });

    it('allows cancellation after matching', async () => {
      const ride = {
        id: 'ride-n',
        passengerId: 'nusrat-id',
        status: 'MATCHED',
        farePaisa: 2400,
        poolId: 'pool-1',
        createdAt: new Date(),
      };

      prisma.rideRequest.findUnique.mockResolvedValue(ride);
      prisma.rideRequest.update.mockResolvedValue({
        ...ride,
        status: 'CANCELLED',
      });
      prisma.rideStatusHistory.create.mockResolvedValue({});

      await expect(
        service.cancel(
          'nusrat-id',
          'ride-n',
          { reason: 'Changed plans' },
        ),
      ).resolves.toMatchObject({
        id: 'ride-n',
        status: 'CANCELLED',
      });
    });

    it("does not allow cancelling another passenger's ride", async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-r',
        passengerId: 'rafiq-id',
        status: 'REQUESTED',
        farePaisa: 3000,
        poolId: null,
        createdAt: new Date(),
      });

      await expect(
        service.cancel(
          'nusrat-id',
          'ride-r',
          { reason: 'No' },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects cancellation of a completed ride', async () => {
      prisma.rideRequest.findUnique.mockResolvedValue({
        id: 'ride-n',
        passengerId: 'nusrat-id',
        status: 'COMPLETED',
        farePaisa: 3000,
        poolId: 'pool-1',
        createdAt: new Date(),
      });

      await expect(
        service.cancel(
          'nusrat-id',
          'ride-n',
          { reason: 'Too late' },
        ),
      ).rejects.toThrow();

      expect(
        prisma.rideRequest.update,
      ).not.toHaveBeenCalled();
    });
  });
});
