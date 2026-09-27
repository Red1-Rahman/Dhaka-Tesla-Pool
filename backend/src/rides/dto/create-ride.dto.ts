import { IsIn, IsInt, IsLatitude, IsLongitude, Max, Min } from 'class-validator';
import { ZONE_NAMES } from '../../geo/zones.data';

// HTTP-facing field names use camelCase.
// PostgreSQL snake_case naming remains isolated to the Prisma @map(...) layer.
export class CreateRideDto {
  @IsIn(ZONE_NAMES)
  pickupZone: string;

  @IsIn(ZONE_NAMES)
  dropoffZone: string;

  @IsLatitude()
  pickupLat: number;

  @IsLongitude()
  pickupLng: number;

  @IsLatitude()
  dropoffLat: number;

  @IsLongitude()
  dropoffLng: number;

  @IsInt()
  @Min(1)
  @Max(3) // Bullet's capacity, see docs/database-schema.md
  seatsRequested: number;
}
