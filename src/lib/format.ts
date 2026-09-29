const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

/** 62.5 → "62,5", 1500 → "1500" */
export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value * 10) / 10)
}

export function formatKg(value: number): string {
  return `${formatNumber(value)} kg`
}

/** Adds an explicit sign: +2,5 / −3 / 0 */
export function formatSigned(value: number): string {
  const rounded = Math.round(value * 10) / 10
  if (rounded === 0) return '0'
  return `${rounded > 0 ? '+' : '−'}${formatNumber(Math.abs(rounded))}`
}

/** Parses user input like "62,5" or "62.5". Returns NaN for invalid input. */
export function parseDecimal(input: string): number {
  const cleaned = input.trim().replace(',', '.')
  if (cleaned === '') return NaN
  return Number(cleaned)
}
