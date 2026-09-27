import type { CastMember, Zone } from "@/types/api"

// exactly the eight zones from docs/specs.md — no substitutions, no additions.
export const ZONES: Zone[] = [
  "Banani",
  "Gulshan",
  "Mohakhali",
  "Dhanmondi",
  "Mirpur",
  "Uttara",
  "Farmgate",
  "Bashundhara",
]

// distance from Banani in km, used for the Home/request-screen live estimate.
// Gulshan is 2.8 (not 3.1) to match Rafiq's canonical fare below — this was
// the exact drift that made the Home screen quote a different price than
// every other screen for the same trip.
export const DISTANCE_FROM_BANANI_KM: Record<Exclude<Zone, "Banani">, number> = {
  Gulshan: 2.8,
  Mohakhali: 4.2,
  Dhanmondi: 7.8,
  Mirpur: 11.4,
  Uttara: 14.6,
  Farmgate: 5.9,
  Bashundhara: 8.7,
}

// docs/specs.md fare.constants.ts, mirrored here so the frontend can never
// drift from the backend's actual formula.
export const FARE = {
  baseFareTaka: 30,
  perKmRateTaka: 15,
  poolDiscountPct: 0.2,
} as const

// passengerFare = baseFare + (distanceKm * perKmRate) - poolDiscount
export function calculateFare(distanceKm: number, pooled: boolean) {
  const subtotal = FARE.baseFareTaka + distanceKm * FARE.perKmRateTaka
  const discount = pooled ? subtotal * FARE.poolDiscountPct : 0
  return {
    baseFare: FARE.baseFareTaka,
    distanceCharge: distanceKm * FARE.perKmRateTaka,
    subtotal,
    discount,
    total: subtotal - discount,
  }
}

// always this cast, never user1/driver1 — Shirin is a PASSENGER (the
// last-seat concurrency case), this is a one-driver, one-Tesla MVP so
// Jashim is the only driver.
export const CAST: CastMember[] = [
  { name: "Jashim", role: "DRIVER", initials: "JA" },
  { name: "Nusrat", role: "PASSENGER", initials: "NR" },
  { name: "Rafiq", role: "PASSENGER", initials: "RA" },
  { name: "Shirin", role: "PASSENGER", initials: "SH" },
]

export const VEHICLE = {
  driver: "Jashim",
  name: "Tesla Bullet",
  plate: "DHA-GA-1234",
  capacity: 3,
}

// the canonical worked example from docs/specs.md — Nusrat and Rafiq share
// a pickup zone and diverge only at dropoff, which is the entire point of
// the matching-rule demo. Never render them going to the same destination
// or give them the same fare.
export const CANONICAL_POOL = [
  {
    initials: "NR",
    name: "Nusrat",
    pickup: "Banani" as Zone,
    dropoff: "Mohakhali" as Zone,
    distanceKm: 4.2,
    seats: 1,
  },
  {
    initials: "RA",
    name: "Rafiq",
    pickup: "Banani" as Zone,
    dropoff: "Gulshan" as Zone,
    distanceKm: 2.8,
    seats: 1,
  },
].map((passenger) => ({ ...passenger, fare: calculateFare(passenger.distanceKm, true) }))

// third seat for the "pool full" demo state — Shirin is exactly who the
// brief invented for this: the last-seat concurrency story, not a driver
// dashboard filler name.
export const THIRD_SEAT_PASSENGER = {
  initials: "SH",
  name: "Shirin",
  pickup: "Banani" as Zone,
  dropoff: "Uttara" as Zone,
  distanceKm: 14.6,
  seats: 1,
  fare: calculateFare(14.6, true),
}
