import { IsOptional, IsString, MaxLength } from 'class-validator';

// Cancellation itself needs no required fields, the ride id comes from
// the URL param. Reason is optional and only used for the status
// history entry, see docs/database-schema.md's RideStatusHistory table.
export class CancelRideDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
