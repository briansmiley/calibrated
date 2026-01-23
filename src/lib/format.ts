/**
 * Format a number with commas as thousands separators
 * e.g., 1234567 -> "1,234,567"
 */
export function formatWithCommas(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 10 })
}

/**
 * Parse a string that may contain commas back to a number
 * e.g., "1,234,567" -> 1234567
 */
export function parseWithCommas(value: string): number {
  return parseFloat(value.replace(/,/g, ''))
}
