// formats a taka amount (can be fractional from fare math) as the app's
// standard "৳93.00" display string, always two decimals, always mono via
// the caller's font-mono class.
export function formatTaka(amountTaka: number): string {
  return `৳${amountTaka.toFixed(2)}`
}

export function formatSignedTaka(amountTaka: number): string {
  const sign = amountTaka < 0 ? "-" : "+"
  return `${sign}৳${Math.abs(amountTaka).toFixed(2)}`
}
