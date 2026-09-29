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

// Approximate straight-line distance in km between every zone pair, mirrors
// backend/src/geo/geo.service.ts's haversine distance over
// backend/src/geo/zones.data.ts's centroids, kept as a static lookup here
// since the frontend has no live geo service to call yet. Symmetric by
// construction: distanceKm(a, b) === distanceKm(b, a).
const ZONE_DISTANCES_KM: Record<Zone, Partial<Record<Zone, number>>> = {
  Banani: { Gulshan: 2.8, Mohakhali: 4.2, Dhanmondi: 7.8, Mirpur: 11.4, Uttara: 14.6, Farmgate: 5.9, Bashundhara: 8.7 },
  Gulshan: { Mohakhali: 3.9, Dhanmondi: 9.1, Mirpur: 12.8, Uttara: 15.9, Farmgate: 7.2, Bashundhara: 3.4 },
  Mohakhali: { Dhanmondi: 6.5, Mirpur: 9.8, Uttara: 12.7, Farmgate: 3.1, Bashundhara: 7.6 },
  Dhanmondi: { Mirpur: 6.9, Uttara: 15.3, Farmgate: 3.6, Bashundhara: 13.2 },
  Mirpur: { Uttara: 8.8, Farmgate: 8.1, Bashundhara: 15.6 },
  Uttara: { Farmgate: 12.4, Bashundhara: 13.9 },
  Farmgate: { Bashundhara: 10.8 },
  Bashundhara: {},
}

// Looks up either direction, this is the function RideRequestForm should
// call for pickup → dropoff, regardless of which zone is which.
export function distanceKmBetween(a: Zone, b: Zone): number {
  if (a === b) return 0
  return ZONE_DISTANCES_KM[a]?.[b] ?? ZONE_DISTANCES_KM[b]?.[a] ?? 0
}

// Kept for any existing caller that specifically wants "distance from
// Banani", now derived from the full matrix so it can never drift from it.
export const DISTANCE_FROM_BANANI_KM: Record<Exclude<Zone, "Banani">, number> = {
  Gulshan: distanceKmBetween("Banani", "Gulshan"),
  Mohakhali: distanceKmBetween("Banani", "Mohakhali"),
  Dhanmondi: distanceKmBetween("Banani", "Dhanmondi"),
  Mirpur: distanceKmBetween("Banani", "Mirpur"),
  Uttara: distanceKmBetween("Banani", "Uttara"),
  Farmgate: distanceKmBetween("Banani", "Farmgate"),
  Bashundhara: distanceKmBetween("Banani", "Bashundhara"),
}

// Monetary values are represented in paisa throughout the application.
// 30 taka = 3000 paisa, 15 taka = 1500 paisa.
export const FARE = {
  baseFarePaisa: 3000,
  perKmRatePaisa: 1500,
  poolDiscountPct: 0.2,
} as const

// passengerFare = baseFare + (distanceKm * perKmRate) - poolDiscount
export function calculateFare(distanceKm: number, pooled: boolean) {
  const distanceCharge = Math.round(distanceKm * FARE.perKmRatePaisa)
  const subtotal = FARE.baseFarePaisa + distanceCharge
  const discount = pooled ? Math.round(subtotal * FARE.poolDiscountPct) : 0

  return {
    baseFarePaisa: FARE.baseFarePaisa,
    distanceChargePaisa: distanceCharge,
    subtotalPaisa: subtotal,
    discountPaisa: discount,
    totalPaisa: subtotal - discount,
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

// the canonical worked example from docs/specs.md
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
].map((passenger) => ({
  ...passenger,
  fare: calculateFare(passenger.distanceKm, true),
}))

export const THIRD_SEAT_PASSENGER = {
  initials: "SH",
  name: "Shirin",
  pickup: "Banani" as Zone,
  dropoff: "Uttara" as Zone,
  distanceKm: 14.6,
  seats: 1,
  fare: calculateFare(14.6, true),
}
