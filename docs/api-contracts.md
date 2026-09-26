# API Contracts

Base URL: `/api/v1`. All authenticated routes require `Authorization: Bearer <jwt>`. All request bodies are validated with `class-validator` DTOs before reaching a service, invalid input returns `400` with a field-level error list.

## Error format

```json
{
  "statusCode": 400,
  "message": "seats_requested must not exceed vehicle capacity",
  "error": "Bad Request"
}
```

## Auth

### POST /auth/signup
Request:
```json
{ "name": "Nusrat", "phone": "01700000001", "password": "string", "role": "passenger" }
```
Response `201`:
```json
{ "id": "uuid", "name": "Nusrat", "role": "passenger", "token": "jwt" }
```

### POST /auth/signin
Request:
```json
{ "phone": "01700000001", "password": "string" }
```
Response `200`: same shape as signup. `401` on bad credentials.

## Rides (passenger)

### POST /rides
Creates a ride request and returns an estimated fare. Requires passenger role.
Request:
```json
{
  "pickup_zone": "Banani",
  "dropoff_zone": "Mohakhali",
  "pickup_lat": 23.7937,
  "pickup_lng": 90.4066,
  "dropoff_lat": 23.7806,
  "dropoff_lng": 90.4074,
  "seats_requested": 1
}
```
Response `201`:
```json
{
  "id": "uuid",
  "status": "REQUESTED",
  "fare_paisa": 9300,
  "pool_id": null,
  "created_at": "2026-09-25T08:41:00Z"
}
```

### GET /rides/:id
Returns the ride owned by the caller, `403` if the caller is not the passenger on that ride.

### GET /rides/me
List the caller's own ride history, most recent first.

### PATCH /rides/:id/cancel
Allowed only while status is `REQUESTED` or `MATCHED`. Returns `409` if the ride has already started or completed. Enforced via the shared transition map in `common/status-machine.ts` as of `feature/tesla-pooling`, matching the table below.

## Vehicles and driver status

### PATCH /vehicles/me/online
Body: `{ "is_online": true }`. Toggles the calling driver's own vehicle. `403` if the caller has no vehicle.

### GET /rides/available
Driver-only. Returns unmatched `REQUESTED` rides whose pickup zone is compatible with the driver's current pool (or an empty pool), per the matching rule in `specs.md`.

## Pools (driver)

### POST /pools/:rideRequestId/accept
Driver accepts a ride request, either starting a new pool or joining an existing open pool on their own vehicle. Enforces capacity inside a DB transaction, returns `409` if the last seat was already taken (the concurrency case in `specs.md`).
Response `200`:
```json
{ "pool_id": "uuid", "ride_request_id": "uuid", "status": "MATCHED", "seats_taken": 2, "capacity": 3 }
```

### PATCH /pools/:id/driver-arrived
Transitions every ride request in the pool to `DRIVER_ARRIVED`.

### PATCH /pools/:id/start
Transitions every ride request in the pool to `STARTED`. Rejects if the pool has fewer than one member or is not in `DRIVER_ARRIVED`.

### PATCH /pools/:id/complete
Transitions every ride request in the pool to `COMPLETED`, writes a `RideStatusHistory` row per member, and creates a `Payment` row per member using each member's own `fare_paisa`.

### GET /pools/:id
Driver-only. Returns the pool, its vehicle, and every passenger's ride request and fare, used for the "see who's assigned to the ride" requirement. Passengers cannot call this, they see only their own ride via `GET /rides/:id`.

## Status transition map (enforced server-side)

| From | Allowed to |
|---|---|
| REQUESTED | MATCHED, CANCELLED |
| MATCHED | DRIVER_ARRIVED, CANCELLED |
| DRIVER_ARRIVED | STARTED |
| STARTED | COMPLETED |
| COMPLETED | (none) |
| CANCELLED | (none) |

Any transition not in this table returns `409 Conflict`. The map lives in one file (`common/status-machine.ts`) and both `rides` and `pools` services import it, so there is exactly one place to check or change the rules.
