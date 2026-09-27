# Database Schema

## ERD

```mermaid
erDiagram
    User ||--o{ RideRequest : "makes (as passenger)"
    User ||--o| Vehicle : "owns (as driver)"
    Vehicle ||--o{ Pool : "carries"
    Pool ||--o{ PoolMembership : "contains"
    RideRequest ||--o| PoolMembership : "joins"
    RideRequest ||--o{ RideStatusHistory : "logs"
    RideRequest ||--o| Payment : "settles via"

    User {
        uuid id PK
        string name
        string phone UK
        string password_hash
        string role "passenger or driver"
        int wallet_balance_paisa
        timestamp created_at
    }
    Vehicle {
        uuid id PK
        uuid driver_id FK
        string name "e.g. Bullet"
        int capacity
        bool is_online
        timestamp created_at
    }
    RideRequest {
        uuid id PK
        uuid passenger_id FK
        string pickup_zone
        string dropoff_zone
        float pickup_lat
        float pickup_lng
        float dropoff_lat
        float dropoff_lng
        int seats_requested
        string status
        uuid pool_id FK "nullable"
        int fare_paisa
        timestamp created_at
        timestamp updated_at
    }
    Pool {
        uuid id PK
        uuid vehicle_id FK
        string status
        timestamp started_at
        timestamp completed_at
    }
    PoolMembership {
        uuid id PK
        uuid pool_id FK
        uuid ride_request_id FK
        int seat_index
    }
    RideStatusHistory {
        uuid id PK
        uuid ride_request_id FK
        string from_status
        string to_status
        timestamp changed_at
    }
    Payment {
        uuid id PK
        uuid ride_request_id FK
        string method "cash or teslapay"
        int amount_paisa
        string status
        timestamp created_at
    }
```

## Table notes

**User**: `role` is a simple enum (`passenger`, `driver`). One table for both roles keeps auth in one place; a driver additionally owns exactly one `Vehicle` for this MVP (one Tesla per driver, matching the Jashim/Bullet pairing in the brief).

**Vehicle**: `capacity` is fixed per vehicle (Bullet = 3). `is_online` gates whether the driver receives new ride requests.

**RideRequest**: `pool_id` is nullable because a request starts unpooled (`REQUESTED`) and may or may not end up sharing a vehicle. `status` is a string constrained by the application-level state machine in `common/status-machine.ts`, not a DB enum, so adding a status later is a one-line change, not a migration that touches an enum type.

**Pool**: represents one shared trip in Bullet. Created when the first request is matched or accepted; additional requests join via `PoolMembership` until capacity is reached.

**PoolMembership**: the join table that enforces "occupied seats never exceed capacity." A unique constraint on `(pool_id, ride_request_id)` prevents double-joining, and the seat-count check happens inside the transaction described in `specs.md`.

**RideStatusHistory**: append-only audit log. Every status transition writes a row here, which is what lets you answer "explain exactly what happened" after a ride completes, per the brief's Section 2. The first row for a ride is a slight exception: it records `fromStatus: 'NONE'` at creation, capturing the initial state rather than an actual transition, `'NONE'` is not a recognized status in `status-machine.ts`'s transition map and this first row is written directly, not through `assertTransition()`.

**Payment**: one row per ride, `status` is a plain string. The MVP only ever writes `'completed'`, `charge()` in `payments.service.ts` has no failure path modeled (no retry, no rejected charge), since cash and simulated TeslaPay both succeed immediately with no real gateway to fail against. `'pending'` and `'failed'` are reasonable states to add once a real gateway exists, but are not currently reachable.

## Constraints and indexes

- `User.phone`: unique index, used for login lookup.
- `Vehicle.driver_id`: unique (one vehicle per driver in this MVP).
- `RideRequest.passenger_id`, `RideRequest.pool_id`: indexed, used for "my rides" and "pool passengers" queries.
- `PoolMembership (pool_id, ride_request_id)`: unique composite index, prevents duplicate membership and doubles as the fast lookup for "how many seats are taken."
- `RideStatusHistory.ride_request_id`: indexed, used to render a ride's timeline.
- All monetary columns (`wallet_balance_paisa`, `fare_paisa`, `amount_paisa`) are integers, not floats or decimals, storing paisa so no rounding error ever accumulates. One taka equals 100 paisa.

## Why a join table instead of a foreign key on RideRequest alone

`RideRequest.pool_id` tells you which pool a request belongs to, but `PoolMembership` is what lets you enforce and query seat occupancy cleanly (count rows, lock rows) without scanning every ride request in the table. It also gives you a natural place to store `seat_index` if you ever want deterministic seat assignment.

## Migration status

The schema above is applied via `backend/prisma/migrations/20260926120000_init/migration.sql`, generated from `schema.prisma` with `npx prisma migrate dev`, this is the first real migration, not just a schema file that was never run. The generated index and constraint names, if you need to reference them directly in a query or a support ticket, are:

- `users_phone_key`, `vehicles_driver_id_key`
- `ride_requests_passenger_id_idx`, `ride_requests_pool_id_idx`
- `pools_vehicle_id_idx`
- `pool_memberships_ride_request_id_key` (enforces one membership per ride request), `pool_memberships_pool_id_ride_request_id_key` (the composite uniqueness described above)
- `ride_status_history_ride_request_id_idx`
- `payments_ride_request_id_key`

`docker-compose.yml`'s `api` service runs `npx prisma migrate deploy` on startup, which applies this migration file, it does not generate new ones. Any future schema change needs a new migration created locally with `npx prisma migrate dev --name <description>` and committed alongside the `schema.prisma` change in the same PR.
