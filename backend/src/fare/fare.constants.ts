// Every number here is quoted directly in docs/specs.md, keep the two in
// sync, changing a value here without updating the doc's worked example
// breaks the "hand-checkable fare" requirement from Section 5 of the brief.

export const FARE_CONSTANTS = {
  baseFarePaisa: 3000, // BDT 30
  perKmRatePaisa: 1500, // BDT 15 per km
  poolDiscountPct: 0.2, // 20% off for pooled riders
} as const;
