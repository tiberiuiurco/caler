export interface ParsedEntry {
  duration: number
  title: string
}

const ENTRY_PATTERN = /^\s*(\d+(?:\.\d+)?)\s+(.+?)\s*$/

/**
 * Parses quick-add input of the form "DURATION TEXT", e.g. "1.5 Write report".
 * Returns null when the input doesn't match (missing duration or title).
 */
export function parseEntry(input: string): ParsedEntry | null {
  const match = ENTRY_PATTERN.exec(input)
  if (!match) return null
  const duration = Number.parseFloat(match[1])
  if (!Number.isFinite(duration) || duration <= 0) return null
  return { duration, title: match[2] }
}
