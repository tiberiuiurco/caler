import { addDays, format, startOfWeek } from 'date-fns'
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

export function formatDayLabel(key: DateKey): string {
  return format(keyToDate(key), 'EEEE, MMM d')
}

export function formatWeekdayShort(key: DateKey): string {
  return format(keyToDate(key), 'EEE d')
}
