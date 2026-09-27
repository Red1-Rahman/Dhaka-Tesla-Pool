export type Zone =
  | "Banani"
  | "Gulshan"
  | "Mohakhali"
  | "Dhanmondi"
  | "Mirpur"
  | "Uttara"
  | "Farmgate"
  | "Bashundhara"

// exact strings from common/status-machine.ts — never invent a friendlier
// label for these, they're used verbatim in status pills.
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
  baseFare: number
  distanceCharge: number
  subtotal: number
  discount: number
  total: number
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

// shape RidesController and PoolsController will eventually return —
// lib/api-client.ts targets this so wiring in the real backend later is a
// swap-the-body change, not a rewrite of every page.
export interface RideRequestResponse {
  id: string
  status: RideStatus
  farePaisa: number
  poolId: string | null
  createdAt: string
}
