export function formatPaisa(paisa: number): string {
  return paisa.toLocaleString("en-BD")
}

export function formatSignedPaisa(paisa: number): string {
  const sign = paisa < 0 ? "-" : "+"
  return `${sign}${formatPaisa(Math.abs(paisa))}`
}
