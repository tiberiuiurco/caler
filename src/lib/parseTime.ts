const CLOCK_PATTERN = /^(\d{1,2}):(\d{2})$/
const DECIMAL_PATTERN = /^\d{1,2}(?:\.\d+)?$/

/**
 * Parses a flexible time of day into hours from midnight: "07:30", "7:30", "7" and "7.5" all work.
 * Returns null for anything unparseable or outside 00:00–24:00.
 */
export function parseTime(input: string): number | null {
  const value = input.trim()
  const clock = CLOCK_PATTERN.exec(value)
  let hour: number
  if (clock) {
    const minutes = Number.parseInt(clock[2], 10)
    if (minutes >= 60) return null
    hour = Number.parseInt(clock[1], 10) + minutes / 60
  } else if (DECIMAL_PATTERN.test(value)) {
    hour = Number.parseFloat(value)
  } else {
    return null
  }
  return hour >= 0 && hour <= 24 ? hour : null
}

/** Parses marker input of the form "TIME [LABEL]", e.g. "7:30 Lunch" or just "18". */
export function parseMarkerEntry(input: string): { hour: number; label: string } | null {
  const [, time = '', label = ''] = /^\s*(\S+)(?:\s+(.*?))?\s*$/.exec(input) ?? []
  const hour = parseTime(time)
  return hour === null ? null : { hour, label }
}
