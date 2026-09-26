import { Injectable } from '@nestjs/common';
import { FARE_CONSTANTS } from './fare.constants';

// One public method, one job: turn a distance into an integer-paisa fare.
// This is the other swap point from docs/architecture.md, a dynamic or
// surge-pricing engine later replaces only the body of calculateFare(),
// callers never change.
@Injectable()
export class FareService {
  calculateFare(distanceKm: number, pooled: boolean): number {
    const { baseFarePaisa, perKmRatePaisa, poolDiscountPct } = FARE_CONSTANTS;

    const rawFare = baseFarePaisa + distanceKm * perKmRatePaisa;
    const discount = pooled ? rawFare * poolDiscountPct : 0;

    // Round half up to the nearest paisa, per docs/specs.md, money never
    // stays a float past this point.
    return Math.round(rawFare - discount);
  }
}
