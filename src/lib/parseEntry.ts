export interface ParsedEntry {
  duration: number
  title: string
  /** True when only a duration was given (no title): the interval should be skipped rather than filled with a task. */
  isSkip: boolean
}

const ENTRY_PATTERN = /^\s*(\d+(?:\.\d+)?)(?:\s+(\S.*?))?\s*$/

/**
 * Parses quick-add input of the form "DURATION TEXT", e.g. "1.5 Write report".
 * A bare duration with no title (e.g. "1") is treated as a skip: the cursor advances
 * by that duration but no task is created.
 * Returns null when the input doesn't match (missing or invalid duration).
 */
export function parseEntry(input: string): ParsedEntry | null {
  const match = ENTRY_PATTERN.exec(input)
  if (!match) return null
  const duration = Number.parseFloat(match[1])
  if (!Number.isFinite(duration) || duration <= 0) return null
  const title = match[2] ?? ''
  return { duration, title, isSkip: title.trim() === '' }
}
