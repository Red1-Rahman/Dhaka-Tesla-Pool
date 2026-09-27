// All money in this codebase is stored and passed around as integer
// paisa, see docs/database-schema.md's "why paisa, not decimal" note and
// the *_paisa naming rule in docs/conventions.md. These two functions are
// the only place a paisa value is ever converted for human display,
// nothing upstream of this file should do that conversion inline.

const PAISA_PER_TAKA = 100;

// 7440 -> 74.4. Returns a plain number, not a string, for callers that
// need to do further math (e.g. summing several fares before display).
export function toTaka(paisa: number): number {
  return paisa / PAISA_PER_TAKA;
}

// 7440 -> "৳74.40". Always two decimal places, even when the amount is a
// whole taka, so a list of fares lines up visually.
export function formatTaka(paisa: number): string {
  return `৳${toTaka(paisa).toFixed(2)}`;
}
