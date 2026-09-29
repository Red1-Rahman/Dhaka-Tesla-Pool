export type Zone =
  | "Banani"
  | "Gulshan"
  | "Mohakhali"
  | "Dhanmondi"
  | "Mirpur"
  | "Uttara"
  | "Farmgate"
  | "Bashundhara"

export type RideStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED"

export type Role = "PASSENGER" | "DRIVER"

export interface CastMember {
  name: string
  role: Role
  initials: string
}

export interface FareBreakdownValue {
  baseFarePaisa: number
  distanceChargePaisa: number
  subtotalPaisa: number
  discountPaisa: number
  totalPaisa: number
}

export interface PoolPassenger {
  initials: string
  name: string
  pickup: Zone
  dropoff: Zone
  distanceKm: number
  seats: number
  fare: FareBreakdownValue
}

export interface RideHistoryEntry {
  id: string
  pickup: Zone
  dropoff: Zone
  date: string
  fareTotal: number
  status: RideStatus
}

export interface RideRequestResponse {
  id: string
  status: RideStatus
  farePaisa: number
  poolId: string | null
  createdAt: string
}

export interface VehicleResponse {
  id: string
  name: string
  capacity: number
  isOnline: boolean
}

export interface AvailableRideResponse {
  id: string
  pickupZone: Zone
  dropoffZone: Zone
  seatsRequested: number
  farePaisa: number
  createdAt: string
}

export interface PoolPassengerResponse {
  rideRequestId: string
  passengerId: string
  pickupZone: Zone
  dropoffZone: Zone
  seatsRequested: number
  farePaisa: number
  status: RideStatus
}

export interface PoolResponse {
  poolId: string
  status: RideStatus
  vehicle: {
    id: string
    name: string
    capacity: number
  }
  passengers: PoolPassengerResponse[]
}

export interface PoolTransitionResponse {
  poolId: string
  status: RideStatus
  passengerCount: number
}

export interface AcceptRideResponse {
  poolId: string
  rideRequestId: string
  status: RideStatus
  seatsTaken: number
  capacity: number
}
