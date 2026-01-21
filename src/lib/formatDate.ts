/**
 * Format a date string as "Jan 5 at 3:45 PM"
 */
export function formatTimestamp(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' at ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/**
 * Format a date string as "1/5/2025"
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString()
}
