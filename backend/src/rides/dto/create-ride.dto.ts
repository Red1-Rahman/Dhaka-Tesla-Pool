import { IsIn, IsLatitude, IsLongitude, IsInt, Min, Max } from 'class-validator';
import { ZONE_NAMES } from '../../geo/zones.data';

// Field names match docs/api-contracts.md's request body exactly
// (snake_case), so the wire format needs no transform layer between
// the documented contract and what the controller receives.
export class CreateRideDto {
  @IsIn(ZONE_NAMES)
  pickup_zone: string;

  @IsIn(ZONE_NAMES)
  dropoff_zone: string;

  @IsLatitude()
  pickup_lat: number;

  @IsLongitude()
  pickup_lng: number;

  @IsLatitude()
  dropoff_lat: number;

  @IsLongitude()
  dropoff_lng: number;

  @IsInt()
  @Min(1)
  @Max(3) // Bullet's capacity, see docs/database-schema.md
  seats_requested: number;
}
