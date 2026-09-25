# Conventions

These conventions exist so the implementation never drifts from the docs. If a rule below changes, update it in the same commit as the code change.

## Branching

- `master`, always deployable, only receives merges from `pre-release`.
- `pre-release`, integration branch, feature branches merge here first.
- `release/vX.Y.Z`, cut from `pre-release` once a version is ready to ship.
- `feature/<short-name>`, one feature per branch, examples: `feature/passenger-auth`, `feature/tesla-pooling`, `feature/driver-flow`.

## Commit messages

Format: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`.

```
feat(auth): add passenger login endpoint
feat(pool): enforce Bullet's seat capacity
fix(pool): prevent overbooking available seats
build(docker): add compose setup for api and postgres
docs(api): document pool accept endpoint
test(pool): add concurrent seat claim test
```

One commit equals one understandable logical change. Avoid vague messages (`update`, `fix`, `final`, `working now`). Avoid fifty micro-commits made only to satisfy this rule, group related work into one honest commit.

## Naming

- Files: `kebab-case.ts`, one class or one concern per file (`fare.service.ts`, `zones.data.ts`).
- Classes: `PascalCase` (`RidesService`, `PoolMembership`).
- DTOs: suffix with `Dto` (`CreateRideDto`, `AcceptPoolDto`).
- Database tables: `PascalCase` singular, matching Prisma model names (`RideRequest`, not `ride_requests`).
- Status strings: `UPPER_SNAKE_CASE` (`REQUESTED`, `DRIVER_ARRIVED`), matching the lifecycle in `docs/specs.md` exactly, character for character.
- Money variables: always suffix with `_paisa` or `Paisa` (`fare_paisa`, `farePaisa`), never store or pass around a bare `fare` without a unit.

## Code style rules

- A service function does one thing, if you need "and" to describe what it does, split it.
- Business logic lives only in `*.service.ts` files. Controllers validate and delegate, they never contain `if` statements about ride status or fare math.
- The three swap-point modules (`geo`, `fare`, `payments`, see `docs/architecture.md`) each export exactly one public function or class per concern, callers never reach past that boundary into internal helpers.
- No magic numbers in business logic, constants live in a co-located `*.constants.ts` file (see `fare.constants.ts`).
- Every non-trivial function gets a one-line comment describing what it does, not how, the code itself shows how.
- Prefer explicit return types on service functions, it doubles as documentation when reading the file.
- Status transition checks always go through `common/status-machine.ts`, never a hand-written `if (status === 'X')` chain duplicated elsewhere.

## Testing conventions

- One test file per service (`rides.service.spec.ts`), integration tests for endpoints that touch the database or concurrency (`pools.e2e-spec.ts`).
- Test names describe behavior, not implementation: `rejects a fourth passenger when vehicle capacity is three`, not `test capacity 1`.
- The concurrency test must actually run two claims in parallel (`Promise.all`) against a real test database, not mock the lock away, that defeats the point of the test.

## Documentation sync rule

Any change to the state machine, fare formula, matching rule, or an API endpoint's request/response shape must be reflected in the matching file under `docs/` in the same pull request. A doc that lags the code is worse than no doc, since it actively misleads whoever reads it next, including you in the interview.
