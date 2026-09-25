# Specs: Fare, Matching, Lifecycle, Concurrency

## Zone list (predefined, no real map API)

```
Banani, Gulshan, Mohakhali, Dhanmondi, Mirpur, Uttara, Farmgate, Bashundhara
```

Each zone has a fixed lat/lng centroid in `geo/zones.data.ts`. Distance between two points uses the haversine formula, no external API call. This is the entire "keep geography simple" implementation from Section 4 of the brief.

## Matching rule

Two ride requests can share a Tesla if:

1. Their pickup zones are identical or adjacent, per a static adjacency list (example: Banani is adjacent to Gulshan and Mohakhali), and
2. Their dropoff zones are compatible, meaning either the same zone, or the second dropoff sits within a small bearing/distance tolerance of a straight line from pickup to the first dropoff (a simple "on the way" heuristic, not real routing).

Applied to the story: Nusrat (Banani to Mohakhali) and Rafiq (Banani to Gulshan 1) share a pickup zone and diverge only at the destination, so they match. Shirin arriving 30 seconds later with one seat left is a capacity case, not a matching case, see the concurrency section below.

## Fare model

```
passengerFare = baseFare + (distanceKm * perKmRate) - poolDiscount
poolDiscount  = pooled ? (baseFare + distanceKm * perKmRate) * 0.20 : 0
```

Constants (in `fare/fare.constants.ts`):

| Constant | Value |
|---|---|
| baseFare | 3000 paisa (BDT 30) |
| perKmRate | 1500 paisa/km |
| poolDiscountPct | 0.20 |

### Worked example, hand-checkable

Nusrat, Banani to Mohakhali, approximately 4.2 km, pooled:
```
9300 = 3000 + (4.2 * 1500)
7440 = 9300 * 0.80
```
Rafiq, Banani to Gulshan 1, approximately 2.8 km, pooled:
```
7200 = 3000 + (2.8 * 1500)
5760 = 7200 * 0.80
```

Each passenger pays for their own distance, the discount is what makes pooling worth it over a solo ride. All amounts are integer paisa, so multiply first, then round the final result if the multiplication ever produces a fraction (it will not here, but document rounding as "round half up to the nearest paisa" for the general case).

## Lifecycle

```
REQUESTED -> MATCHED -> DRIVER_ARRIVED -> STARTED -> COMPLETED
    |            |
    v            v
CANCELLED    CANCELLED
```

See `docs/api-contracts.md` for the exact allowed-transition table. Cancellation is only valid before `STARTED`, once a trip has physically begun, a passenger cannot cancel out of it.

## Concurrency: the last-seat race

Setup: Bullet has 1 seat left. Nusrat and Shirin both call `POST /pools/:rideRequestId/accept` (via the driver accepting each) at nearly the same instant, both requests read "1 seat available" before either write happens.

MVP solution: the accept operation runs inside a single Prisma transaction that takes a row lock on the `Vehicle` (or `Pool`) row with `SELECT ... FOR UPDATE` before counting current `PoolMembership` rows and before inserting the new one. The second transaction blocks until the first commits, then re-reads the count and sees capacity is full, so it returns `409 Conflict` instead of overbooking.

```sql
BEGIN;
SELECT * FROM "Pool" WHERE id = $1 FOR UPDATE;
-- count PoolMembership rows for this pool
-- if count < vehicle.capacity: insert membership, COMMIT
-- else: ROLLBACK, return 409
```

At larger scale, this row lock becomes a contention point under high request volume. The documented alternative: optimistic concurrency with a `version` integer column on `Pool`, the update includes `WHERE version = $expectedVersion`, a `0` rows-affected result means someone else won the race, retry or fail fast. Beyond that, a queue-based reservation system (a single worker per vehicle processing seat claims in order) removes lock contention entirely at the cost of added latency and infrastructure, not justified for this MVP.
