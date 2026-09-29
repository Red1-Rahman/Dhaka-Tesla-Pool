# API Reference

This is the HTTP API behind Dhaka Tesla Pool, a ride pooling service for electric rickshaws in Dhaka. Passengers request rides between predefined city zones, and drivers accept requests into a shared pool that respects the vehicle's seat capacity.

This document describes what the API does today. If you change an endpoint, a request or response shape, the status lifecycle or the fare formula, update this file in the same commit.

## Contents

- [Conventions](#conventions)
- [Endpoint overview](#endpoint-overview)
- [Authentication](#authentication)
- [Users](#users)
- [Rides (passenger)](#rides-passenger)
- [Vehicles (driver)](#vehicles-driver)
- [Pools (driver)](#pools-driver)
- [Health](#health)
- [Reference](#reference)
- [Try it with curl](#try-it-with-curl)
- [Current limitations](#current-limitations)

## Conventions

**Base URL.** Every route is served under `/api/v1`. In local development that is `http://localhost:3001/api/v1`.

**Format.** Requests and responses are JSON. Send `Content-Type: application/json` on requests with a body.

**Casing.** JSON fields are `camelCase`.

**Money.** Every amount is an integer number of paisa, and 100 paisa equals 1 taka. Money fields always end in `Paisa` (for example `farePaisa`). A value of `5188` means BDT 51.88.

**Timestamps.** ISO 8601 strings in UTC, for example `2026-09-25T08:41:00.000Z`.

**Authentication.** Protected routes need a JWT in the `Authorization` header:

```
Authorization: Bearer <token>
```

Get a token from `POST /auth/signup` or `POST /auth/signin`. Tokens expire. When a protected route returns `401`, sign in again.

**Roles.** Each account is either a `PASSENGER` or a `DRIVER`. A route limited to one role returns `403` to the other.

**Validation.** Request bodies are validated before any logic runs. Unknown fields are rejected, not ignored, so a body containing a field the endpoint does not declare fails with `400`.

### Error format

Every error uses the same shape. `message` is a string for most errors, and an array of strings when several validation rules fail at once.

```json
{
  "statusCode": 409,
  "message": "Vehicle capacity would be exceeded",
  "error": "Conflict"
}
```

Validation failure:

```json
{
  "statusCode": 400,
  "message": [
    "seatsRequested must not be greater than 3",
    "property coordinates should not exist"
  ],
  "error": "Bad Request"
}
```

| Status | Meaning |
|---|---|
| `400` | The body failed validation, or a business rule about the input was broken (for example, same pickup and destination). |
| `401` | Missing, invalid or expired token, or wrong credentials on sign in. |
| `403` | Authenticated, but the role or ownership does not allow this action. |
| `404` | The resource does not exist. |
| `409` | The action conflicts with current state: an invalid status transition, a full vehicle, an incompatible pool, a duplicate phone number, or losing a race for the same ride. |
| `500` | Unexpected server error. The response never includes internal details. |

## Endpoint overview

| Method | Path | Role | Success |
|---|---|---|---|
| `POST` | `/auth/signup` | Public | `201` |
| `POST` | `/auth/signin` | Public | `200` |
| `GET` | `/users/me` | Any signed in user | `200` |
| `PATCH` | `/users/me` | Any signed in user | `200` |
| `POST` | `/rides` | Passenger | `201` |
| `GET` | `/rides/me` | Passenger | `200` |
| `GET` | `/rides/available` | Driver | `200` |
| `GET` | `/rides/:id` | Passenger (owner) | `200` |
| `PATCH` | `/rides/:id/cancel` | Passenger (owner) | `200` |
| `GET` | `/vehicles/me` | Driver | `200` |
| `PATCH` | `/vehicles/me/online` | Driver | `200` |
| `POST` | `/pools/:rideRequestId/accept` | Driver | `201` |
| `GET` | `/pools/:id` | Driver (owner) | `200` |
| `PATCH` | `/pools/:id/driver-arrived` | Driver (owner) | `200` |
| `PATCH` | `/pools/:id/start` | Driver (owner) | `200` |
| `PATCH` | `/pools/:id/complete` | Driver (owner) | `200` |
| `GET` | `/health` | Public | `200` |

## Authentication

### POST /auth/signup

Creates an account and returns a token, so the caller is signed in immediately.

Request:

```json
{
  "name": "Nusrat",
  "phone": "01700000001",
  "password": "password123",
  "role": "PASSENGER"
}
```

| Field | Rules |
|---|---|
| `name` | String, at least 2 characters. |
| `phone` | A valid Bangladeshi phone number. Use the 11 digit national format (`01XXXXXXXXX`). The value is stored exactly as sent, so use the same format when you sign in. |
| `password` | String, at least 8 characters. |
| `role` | `PASSENGER` or `DRIVER`. Uppercase only. |

Response `201`:

```json
{
  "id": "5b0d7c1e-6c1f-4a52-9d51-0f6a0e3f2c11",
  "name": "Nusrat",
  "role": "PASSENGER",
  "token": "eyJhbGciOi..."
}
```

Errors: `400` for invalid fields, `409` if the phone number is already registered.

### POST /auth/signin

Request:

```json
{ "phone": "01700000001", "password": "password123" }
```

Response `200`: the same shape as signup.

Errors: `400` for invalid fields, `401` with `Invalid phone number or password` for an unknown phone number or a wrong password (the two cases are deliberately indistinguishable).

## Users

### GET /users/me

Returns the signed in user's profile. There is no endpoint to read another user.

Response `200`:

```json
{
  "id": "5b0d7c1e-6c1f-4a52-9d51-0f6a0e3f2c11",
  "name": "Jashim",
  "phone": "01700000000",
  "role": "DRIVER",
  "walletBalancePaisa": 0,
  "createdAt": "2026-09-26T12:00:00.000Z",
  "vehicle": {
    "id": "0c2b9f1a-3d44-4e7b-8a10-51c7f0d9e6aa",
    "name": "Bullet",
    "capacity": 3,
    "isOnline": true
  }
}
```

`vehicle` is `null` for passengers and for drivers without a vehicle.

### PATCH /users/me

Updates the caller's own profile. Only `name` can be changed. Phone number and role cannot.

Request:

```json
{ "name": "Nusrat Jahan" }
```

`name` is optional, a string of at least 2 characters. Response `200`: the full profile, same shape as `GET /users/me`.

## Rides (passenger)

A ride is a passenger's request to travel from one zone to another. Every ride response has this shape:

```json
{
  "id": "e4a1f0b2-7a2d-4a55-b3f1-2f6d1c9a0b77",
  "status": "REQUESTED",
  "farePaisa": 5188,
  "poolId": null,
  "createdAt": "2026-09-25T08:41:00.000Z"
}
```

| Field | Description |
|---|---|
| `status` | One of the values in the [status lifecycle](#status-lifecycle). |
| `farePaisa` | The current fare in paisa. At creation this is the solo fare. It is recalculated when the ride joins a pool. See [Fares](#fares). |
| `poolId` | `null` until a driver accepts the ride. |

### POST /rides

Creates a ride request and returns it with a solo fare quote.

Request:

```json
{
  "pickupZone": "Banani",
  "dropoffZone": "Mohakhali",
  "seatsRequested": 1
}
```

| Field | Rules |
|---|---|
| `pickupZone` | One of the [supported zones](#zones). |
| `dropoffZone` | One of the supported zones, and different from `pickupZone`. |
| `seatsRequested` | Integer from 1 to 3. |

Coordinates are not accepted. The server looks them up from the zone names, so the fare can never be computed from a location that disagrees with the zone.

Response `201`: a ride with `status` `REQUESTED` and `poolId` `null`.

Errors: `400` for invalid fields, unknown fields, or identical pickup and destination.

### GET /rides/me

Lists the caller's rides, newest first. Response `200`: an array of rides. The list is not paginated.

### GET /rides/:id

Returns one of the caller's own rides.

Errors: `404` if the ride does not exist, `403` if it belongs to another passenger.

### PATCH /rides/:id/cancel

Cancels a ride. Allowed while the status is `REQUESTED` or `MATCHED`.

The body is optional:

```json
{ "reason": "Plans changed" }
```

`reason` is a string of at most 200 characters. It is echoed back in the response as `cancelReason` but is not stored.

Response `200`: the ride with `status` `CANCELLED`, plus `cancelReason` when one was sent.

Errors: `403` if the ride belongs to someone else, `404` if it does not exist, `409` if the ride has already reached `DRIVER_ARRIVED`, `STARTED`, `COMPLETED` or `CANCELLED`.

### GET /rides/available

Driver only. Lists rides waiting for a driver, oldest first. Only rides with status `REQUESTED` that are not yet in a pool appear.

Response `200`:

```json
[
  {
    "id": "e4a1f0b2-7a2d-4a55-b3f1-2f6d1c9a0b77",
    "pickupZone": "Banani",
    "dropoffZone": "Mohakhali",
    "seatsRequested": 1,
    "farePaisa": 5188,
    "createdAt": "2026-09-25T08:41:00.000Z"
  }
]
```

This list is not filtered by the driver's current pool or free seats. Whether a ride can actually join is decided when the driver accepts it.

## Vehicles (driver)

Each driver has at most one vehicle. These routes only ever touch the caller's own vehicle.

Vehicle shape:

```json
{
  "id": "0c2b9f1a-3d44-4e7b-8a10-51c7f0d9e6aa",
  "name": "Bullet",
  "capacity": 3,
  "isOnline": true
}
```

### GET /vehicles/me

Response `200`: the caller's vehicle. `404` with `You do not have a registered vehicle` if the driver has none.

### PATCH /vehicles/me/online

Request:

```json
{ "isOnline": true }
```

`isOnline` is a required boolean. A driver must be online to accept rides.

Response `200`: the updated vehicle. `404` if the driver has no vehicle.

## Pools (driver)

A pool is one shared trip in one vehicle. A driver builds a pool by accepting ride requests, then moves the whole pool through its lifecycle. Every route in this section requires a driver, and the pool routes check that the pool belongs to the caller's vehicle (`403` otherwise, `404` if the pool does not exist).

### POST /pools/:rideRequestId/accept

Accepts a ride request into the driver's pool. If the vehicle has no pool in `MATCHED` status, a new pool is created. Otherwise the ride joins the existing one. The request has no body.

The capacity check and the pool update run in a single locked transaction. If two riders compete for the last seat, exactly one succeeds and the other receives `409`.

When a ride joins a pool that already has members, the pooled fare applies to the new ride and to every existing member, and their `farePaisa` values are recalculated.

Response `201`:

```json
{
  "poolId": "9d3f6a10-1b6e-4c8e-a2f4-7b1e5d0c3a99",
  "rideRequestId": "e4a1f0b2-7a2d-4a55-b3f1-2f6d1c9a0b77",
  "status": "MATCHED",
  "seatsTaken": 2,
  "capacity": 3
}
```

`seatsTaken` counts the ride requests in the pool, including the one just accepted. It equals the number of occupied seats when every request is for a single seat.

Errors:

| Status | Message |
|---|---|
| `404` | `You do not have a registered vehicle` |
| `404` | `Ride request not found` |
| `409` | `Go online before accepting rides` |
| `409` | `Cannot transition ride from <status> to MATCHED` (the ride is no longer `REQUESTED`) |
| `409` | `This ride is not compatible with the vehicle's current pool pickup route` |
| `409` | `This ride is not compatible with the vehicle's current pool dropoff route` |
| `409` | `Vehicle capacity would be exceeded` |
| `409` | `This resource was already claimed by another request` (another driver request won the race for the same ride) |

### GET /pools/:id

Returns the pool, its vehicle and every ride in it, so a driver can see who is assigned. Passengers cannot call this and see only their own rides through `GET /rides/:id`.

Response `200`:

```json
{
  "poolId": "9d3f6a10-1b6e-4c8e-a2f4-7b1e5d0c3a99",
  "status": "MATCHED",
  "vehicle": { "id": "0c2b9f1a-3d44-4e7b-8a10-51c7f0d9e6aa", "name": "Bullet", "capacity": 3 },
  "passengers": [
    {
      "rideRequestId": "e4a1f0b2-7a2d-4a55-b3f1-2f6d1c9a0b77",
      "passengerId": "5b0d7c1e-6c1f-4a52-9d51-0f6a0e3f2c11",
      "pickupZone": "Banani",
      "dropoffZone": "Mohakhali",
      "seatsRequested": 1,
      "farePaisa": 4151,
      "status": "MATCHED"
    }
  ]
}
```

Cancelled rides stay in the list with `status` `CANCELLED`.

### PATCH /pools/:id/driver-arrived

Moves the pool from `MATCHED` to `DRIVER_ARRIVED`, and every active ride in it along with it. Active means not cancelled.

### PATCH /pools/:id/start

Moves the pool from `DRIVER_ARRIVED` to `STARTED`, and every active ride with it. Returns `409` with `Cannot start a pool with no passengers` if the pool has no rides.

### PATCH /pools/:id/complete

Moves the pool from `STARTED` to `COMPLETED`, and every active ride with it. It also records one cash payment per active ride for that ride's own `farePaisa`. Cancelled rides are not charged.

The three transition routes share one response, `200`:

```json
{
  "poolId": "9d3f6a10-1b6e-4c8e-a2f4-7b1e5d0c3a99",
  "status": "DRIVER_ARRIVED",
  "passengerCount": 2
}
```

`passengerCount` is the number of active rides that moved. Errors: `403`, `404`, and `409` with `Cannot transition ride from <status> to <status>` if the pool (or one of its rides) is not in a status that allows the move.

## Health

### GET /health

Public. Returns `200` with `{ "status": "ok" }` only when the API can reach its database, so it is safe to use for container health checks. It is served under the same prefix as every other route, at `/api/v1/health`.

## Reference

### Status lifecycle

Statuses are uppercase strings and are returned exactly as written here.

| From | Allowed next status |
|---|---|
| `REQUESTED` | `MATCHED`, `CANCELLED` |
| `MATCHED` | `DRIVER_ARRIVED`, `CANCELLED` |
| `DRIVER_ARRIVED` | `STARTED` |
| `STARTED` | `COMPLETED` |
| `COMPLETED` | none |
| `CANCELLED` | none |

Any move not in this table is rejected with `409 Conflict`. Pools use the same statuses, except that a pool cannot be cancelled.

### Zones

`pickupZone` and `dropoffZone` must be one of these eight names, spelled and capitalised exactly:

`Banani`, `Gulshan`, `Mohakhali`, `Dhanmondi`, `Mirpur`, `Uttara`, `Farmgate`, `Bashundhara`

Zones are approximate area centres, not a map. Distances between zones are straight line estimates, not routes.

Two riders can share a pool only when their pickup zones are compatible with each other and their dropoff zones are compatible with each other. The server decides this and returns `409` when a ride does not fit.

### Fares

Fares are calculated on the server as integers in paisa.

```
rawFare = 3000 + distanceKm * 1500
pooled  = rawFare * 0.8
```

| Constant | Value |
|---|---|
| Base fare | 3000 paisa (BDT 30) |
| Distance rate | 1500 paisa per km (BDT 15) |
| Pool discount | 20% |

The result is rounded once, to the nearest paisa, at the end.

Worked example, Banani to Mohakhali, a distance of about 1.459 km:

| Fare | Calculation | Result |
|---|---|---|
| Solo | 3000 + 1.459 x 1500 = 5188.39 | 5188 paisa |
| Pooled | 5188.39 x 0.8 = 4150.71 | 4151 paisa |

A ride is quoted at the solo fare when created. Once a driver accepts it into a pool with at least one other ride, the pooled fare applies to every ride in that pool.

## Try it with curl

The demo database contains these accounts, all with the password `password123`:

| Person | Role | Phone |
|---|---|---|
| Jashim | Driver, owns the vehicle Bullet (3 seats) | `01700000000` |
| Nusrat | Passenger | `01700000001` |
| Rafiq | Passenger | `01700000002` |
| Shirin | Passenger | `01700000003` |

```bash
API=http://localhost:3001/api/v1

# Sign in as a passenger and as the driver
PASSENGER_TOKEN=$(curl -s -X POST $API/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"phone":"01700000001","password":"password123"}' | jq -r .token)

DRIVER_TOKEN=$(curl -s -X POST $API/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"phone":"01700000000","password":"password123"}' | jq -r .token)

# Passenger requests a ride
RIDE_ID=$(curl -s -X POST $API/rides \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"pickupZone":"Banani","dropoffZone":"Mohakhali","seatsRequested":1}' | jq -r .id)

# Driver accepts it into a pool
POOL_ID=$(curl -s -X POST $API/pools/$RIDE_ID/accept \
  -H "Authorization: Bearer $DRIVER_TOKEN" | jq -r .poolId)

# Driver runs the trip
for step in driver-arrived start complete; do
  curl -s -X PATCH $API/pools/$POOL_ID/$step \
    -H "Authorization: Bearer $DRIVER_TOKEN"
  echo
done
```

## Current limitations

These are known gaps in the current version, listed so you do not build on behaviour that is not there yet.

- **Drivers cannot create vehicles.** Signing up as a `DRIVER` creates the account only. Vehicle routes and pool acceptance return `404` until a vehicle exists for that driver, and today only the seeded driver has one.
- **No payment or wallet endpoints.** Completing a pool records a cash payment internally, but nothing exposes payments over HTTP, and `walletBalancePaisa` is never changed by the API.
- **Fares do not depend on seats.** A request for three seats costs the same as a request for one.
- **Cancelled rides keep their seat.** Cancelling a `MATCHED` ride does not free its seat in the pool for the purposes of the capacity check.
- **`reason` is not stored.** A cancellation reason is only returned in the cancel response.
- **No pagination.** List endpoints return every matching record.
