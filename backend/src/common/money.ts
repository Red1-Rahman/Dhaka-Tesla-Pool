// All money in this codebase is stored and passed around as integer
// paisa, see docs/database-schema.md's "why paisa, not decimal" note and
// the *_paisa naming rule in docs/conventions.md.
//
// Currency conversion belongs in this module. UI components are responsible
// for rendering the Shapla mark alongside the formatted numeric value.

const PAISA_PER_TAKA = 100;

// 7440 -> 74.4
// Returns a plain number for callers that need to perform further math.
export function toTaka(paisa: number): number {
  return paisa / PAISA_PER_TAKA
}

// 7440 -> "74.40"
// Returns only the human-readable numeric portion.
// The UI renders the Shapla mark separately.
export function formatPaisa(paisa: number): string {
  return toTaka(paisa).toFixed(2)
}
