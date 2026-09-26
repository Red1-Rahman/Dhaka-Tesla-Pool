import { IsOptional, IsString, MaxLength } from 'class-validator';

// Deliberately empty of required fields, the driver comes from
// req.user.userId and the ride comes from the URL param
// (POST /pools/:rideRequestId/accept), see docs/api-contracts.md.
// A note field is the only optional extra a driver might attach.
export class AcceptRideDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
