import { ConflictException } from '@nestjs/common';

// Single source of truth for the lifecycle in docs/specs.md and the
// transition table in docs/api-contracts.md. RidesService and PoolsService
// both call assertTransition() instead of hand-writing status checks, see
// docs/conventions.md: "status transition checks always go through
// common/status-machine.ts, never a hand-written if/else chain."
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['MATCHED', 'CANCELLED'],
  MATCHED: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['STARTED'],
  STARTED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: string, to: string): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

// Throws 409 with a message naming both statuses, so a rejected
// transition is self-explanatory in the API response, not just a bare
// error code.
export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new ConflictException(`Cannot transition ride from ${from} to ${to}`);
  }
}
