import { addDays, differenceInCalendarDays, format, startOfWeek } from 'date-fns'
import type { DateKey } from '../types'

const KEY_FORMAT = 'yyyy-MM-dd'

export function toKey(date: Date): DateKey {
  return format(date, KEY_FORMAT)
}

export function keyToDate(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayKey(): DateKey {
  return toKey(new Date())
}

export function shiftKey(key: DateKey, days: number): DateKey {
  return toKey(addDays(keyToDate(key), days))
}

/** Whole calendar days between `fromKey` and `key` (positive when `key` is later). */
export function daysFromKey(key: DateKey, fromKey: DateKey): number {
  return differenceInCalendarDays(keyToDate(key), keyToDate(fromKey))
}

/**
 * Resolves a bare "month/day" into a full date key, anchored to `fromKey`'s year unless that
 * date already fell before `fromKey` — in which case it rolls over into the next year, so typing
 * an already-passed month/day (e.g. in December) jumps forward instead of into the past.
 * Returns null when the day doesn't exist in that month (e.g. Feb 30, or Feb 29 outside a leap year).
 */
export function resolveMonthDay(month: number, day: number, fromKey: DateKey): DateKey | null {
  const from = keyToDate(fromKey)
  let year = from.getFullYear()
  let candidate = new Date(year, month - 1, day)
  if (candidate < from) {
    year += 1
    candidate = new Date(year, month - 1, day)
  }
  if (candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
  return toKey(candidate)
}

/** Returns the 7 date keys for the Monday-started week containing `key`. */
export function weekKeys(key: DateKey): DateKey[] {
  const monday = startOfWeek(keyToDate(key), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => toKey(addDays(monday, i)))
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Inverse of `formatHour`: parses a "HH:MM" string (as produced by an <input type="time">) into decimal hours. */
export function parseTimeToHours(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) return null
  return hours + minutes / 60
}

export function formatDayLabel(key: DateKey): string {
  return format(keyToDate(key), 'EEEE, MMM d')
}

const RELATIVE_DAY_LABELS: Record<number, string> = { [-1]: 'Yesterday', 0: 'Today', 1: 'Tomorrow' }

/**
 * Day-column heading for a date `offset` days from the view's anchor: "Yesterday"/"Today"/"Tomorrow"
 * (with the full date as a sublabel) right around the anchor, otherwise just the date itself.
 */
export function dayColumnLabel(offset: number, key: DateKey): { label: string; sublabel?: string } {
  const relative = RELATIVE_DAY_LABELS[offset]
  return relative ? { label: relative, sublabel: formatDayLabel(key) } : { label: formatDayLabel(key) }
}

export function formatWeekdayShort(key: DateKey): string {
  return format(keyToDate(key), 'EEE d')
}

/**
 * Fixed-width week range label ("Jul 21 – Jul 27"): month abbreviations are
 * always 3 letters and `dd` always 2 digits, so the rendered width never
 * jitters as the header's prev/next buttons are clicked.
 */
export function formatWeekRangeLabel(weekStart: DateKey, weekEnd: DateKey): string {
  return `${format(keyToDate(weekStart), 'MMM dd')} – ${format(keyToDate(weekEnd), 'MMM dd')}`
}

