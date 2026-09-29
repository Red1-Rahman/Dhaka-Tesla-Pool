import { IsIn, IsInt, Max, Min } from 'class-validator';
import { ZONE_NAMES } from '../../geo/zones.data';
import { MAX_SEATS_PER_REQUEST } from '../rides.constants';

// HTTP-facing field names use camelCase.
// Coordinates are not accepted from the client: the server derives them
// from the zone names (see RidesService.create), so fare and matching can
// never be computed from coordinates that disagree with the zone.
export class CreateRideDto {
  @IsIn(ZONE_NAMES)
  pickupZone!: string;

  @IsIn(ZONE_NAMES)
  dropoffZone!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_SEATS_PER_REQUEST)
  seatsRequested!: number;
}
