export interface ParsedEntry {
  duration: number
  title: string
  /**
   * True when only a duration was given (no title): the interval should be skipped rather than filled with a task.
   * Only skips may have a negative duration, which moves the cursor backwards.
   */
  isSkip: boolean
  /** True when a standalone "dw" token was found (and stripped) at either end of the title. */
  isDeepWork: boolean
}

const ENTRY_PATTERN = /^\s*(-?\d+(?:\.\d+)?)(?:\s+(\S.*?))?\s*$/
const DW_LEADING = /^dw\s+/i
const DW_TRAILING = /\s+dw$/i
const DW_ONLY = /^dw$/i

/**
 * Parses quick-add input of the form "DURATION TEXT", e.g. "1.5 Write report".
 * A bare duration with no title (e.g. "1") is treated as a skip: the cursor advances
 * by that duration but no task is created. A negative bare duration (e.g. "-2") moves the
 * cursor back instead; a negative duration with a title is invalid.
 * A standalone "dw" token (case-insensitive) at either end of the title, e.g.
 * "1.5 dw Write report" or "1.5 Write report dw", marks the task as Deep Work and
 * is stripped from the title.
 * Returns null when the input doesn't match (missing or invalid duration).
 */
export function parseEntry(input: string): ParsedEntry | null {
  const match = ENTRY_PATTERN.exec(input)
  if (!match) return null
  const duration = Number.parseFloat(match[1])
  if (!Number.isFinite(duration) || duration === 0) return null

  let rest = match[2] ?? ''
  let isDeepWork = false
  if (DW_ONLY.test(rest)) {
    isDeepWork = true
    rest = ''
  } else if (DW_LEADING.test(rest)) {
    isDeepWork = true
    rest = rest.replace(DW_LEADING, '')
  } else if (DW_TRAILING.test(rest)) {
    isDeepWork = true
    rest = rest.replace(DW_TRAILING, '')
  }

  const title = rest.trim()
  if (duration < 0 && title !== '') return null
  return { duration, title, isSkip: title === '', isDeepWork }
}
