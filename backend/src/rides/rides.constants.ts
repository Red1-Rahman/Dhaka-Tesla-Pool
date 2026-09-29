// Upper bound on seats in a single request. Matches Bullet's capacity (3).
// The authoritative capacity check is still PoolsService.accept(), which
// compares against the real vehicle.capacity inside the locked transaction.
export const MAX_SEATS_PER_REQUEST = 3;
