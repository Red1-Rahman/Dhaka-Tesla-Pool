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
export const DISTANCE_FROM_BANANI_KM: Record<
  Exclude<Zone, "Banani">,
  number
> = {
  Gulshan: 2.8,
  Mohakhali: 4.2,
  Dhanmondi: 7.8,
  Mirpur: 11.4,
  Uttara: 14.6,
  Farmgate: 5.9,
  Bashundhara: 8.7,
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
  const distanceCharge = Math.round(
    distanceKm * FARE.perKmRatePaisa,
  )
  const subtotal = FARE.baseFarePaisa + distanceCharge
  const discount = pooled
    ? Math.round(subtotal * FARE.poolDiscountPct)
    : 0

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
