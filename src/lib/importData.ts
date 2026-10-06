import type { DateKey, DayRange, Marker, Task } from '../types'

export interface ParsedPlannerData {
  ranges: Record<DateKey, DayRange>
  tasks: Record<DateKey, Task[]>
  weeklyGoals: Record<DateKey, string>
  markers: Record<DateKey, Marker[]>
  dailyNotes: Record<DateKey, string>
}

export interface ParseCounts {
  tasks: number
  days: number
  goalWeeks: number
}

export type ParseResult =
  | { ok: true; data: ParsedPlannerData; counts: ParseCounts }
  | { ok: false; error: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parseRange(value: unknown): DayRange | null {
  if (!isPlainObject(value)) return null
  const { start, end } = value
  if (!isFiniteNumber(start) || !isFiniteNumber(end)) return null
  if (start < 0 || end > 24 || start >= end) return null
  return { start, end }
}

function parseTask(value: unknown, fallbackDate: DateKey): Task | null {
  if (!isPlainObject(value)) return null
  const { id, date, start, duration, title, description, isDeepWork, isDone } = value
  if (typeof id !== 'string' || typeof title !== 'string') return null
  if (!isFiniteNumber(start) || !isFiniteNumber(duration)) return null
  return {
    id,
    date: typeof date === 'string' ? date : fallbackDate,
    start,
    duration,
    title,
    description: typeof description === 'string' ? description : '',
    isDeepWork: typeof isDeepWork === 'boolean' ? isDeepWork : false,
    isDone: typeof isDone === 'boolean' ? isDone : false,
  }
}

function parseMarker(value: unknown, fallbackDate: DateKey): Marker | null {
  if (!isPlainObject(value)) return null
  const { id, date, hour, label } = value
  if (typeof id !== 'string' || !isFiniteNumber(hour) || hour < 0 || hour > 24) return null
  return {
    id,
    date: typeof date === 'string' ? date : fallbackDate,
    hour,
    label: typeof label === 'string' ? label : '',
  }
}

/** Parses and validates a Caler export, backfilling optional fields so older exports still load. */
export function parsePlannerExport(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }

  if (!isPlainObject(raw)) return { ok: false, error: 'Expected a Caler export object.' }

  const rawRanges = raw.ranges
  const rawTasks = raw.tasks
  const rawGoals = raw.weeklyGoals
  const rawMarkers = raw.markers
  const rawNotes = raw.dailyNotes

  if (!isPlainObject(rawRanges)) return { ok: false, error: 'Missing or invalid "ranges" in the file.' }
  if (!isPlainObject(rawTasks)) return { ok: false, error: 'Missing or invalid "tasks" in the file.' }
  if (rawGoals !== undefined && !isPlainObject(rawGoals)) return { ok: false, error: 'Invalid "weeklyGoals" in the file.' }
  if (rawMarkers !== undefined && !isPlainObject(rawMarkers)) return { ok: false, error: 'Invalid "markers" in the file.' }
  if (rawNotes !== undefined && !isPlainObject(rawNotes)) return { ok: false, error: 'Invalid "dailyNotes" in the file.' }

  const ranges: Record<DateKey, DayRange> = {}
  for (const [date, value] of Object.entries(rawRanges)) {
    const range = parseRange(value)
    if (!range) return { ok: false, error: `Invalid day range for ${date}.` }
    ranges[date] = range
  }

  const tasks: Record<DateKey, Task[]> = {}
  let taskCount = 0
  for (const [date, value] of Object.entries(rawTasks)) {
    if (!Array.isArray(value)) return { ok: false, error: `Invalid task list for ${date}.` }
    const parsed: Task[] = []
    for (const entry of value) {
      const task = parseTask(entry, date)
      if (!task) return { ok: false, error: `Invalid task entry for ${date}.` }
      parsed.push(task)
    }
    tasks[date] = parsed
    taskCount += parsed.length
  }

  const weeklyGoals: Record<DateKey, string> = {}
  if (rawGoals) {
    for (const [week, value] of Object.entries(rawGoals)) {
      if (typeof value !== 'string') return { ok: false, error: `Invalid weekly goals for ${week}.` }
      weeklyGoals[week] = value
    }
  }

  const markers: Record<DateKey, Marker[]> = {}
  if (rawMarkers) {
    for (const [date, value] of Object.entries(rawMarkers)) {
      if (!Array.isArray(value)) return { ok: false, error: `Invalid marker list for ${date}.` }
      const parsed: Marker[] = []
      for (const entry of value) {
        const marker = parseMarker(entry, date)
        if (!marker) return { ok: false, error: `Invalid marker entry for ${date}.` }
        parsed.push(marker)
      }
      markers[date] = parsed
    }
  }

  const dailyNotes: Record<DateKey, string> = {}
  if (rawNotes) {
    for (const [date, value] of Object.entries(rawNotes)) {
      if (typeof value !== 'string') return { ok: false, error: `Invalid daily notes for ${date}.` }
      dailyNotes[date] = value
    }
  }

  return {
    ok: true,
    data: { ranges, tasks, weeklyGoals, markers, dailyNotes },
    counts: {
      tasks: taskCount,
      days: Object.keys(tasks).length,
      goalWeeks: Object.keys(weeklyGoals).length,
    },
  }
}

/** Merges imported data into the current store state. Incoming entries win on key/id collisions. */
export function mergePlannerData(current: ParsedPlannerData, incoming: ParsedPlannerData): ParsedPlannerData {
  const ranges = { ...current.ranges, ...incoming.ranges }
  const weeklyGoals = { ...current.weeklyGoals, ...incoming.weeklyGoals }
  const dailyNotes = { ...current.dailyNotes, ...incoming.dailyNotes }

  const tasks: Record<DateKey, Task[]> = { ...current.tasks }
  for (const [date, incomingTasks] of Object.entries(incoming.tasks)) {
    const existing = tasks[date] ?? []
    const incomingIds = new Set(incomingTasks.map((task) => task.id))
    tasks[date] = [...existing.filter((task) => !incomingIds.has(task.id)), ...incomingTasks]
  }

  const markers: Record<DateKey, Marker[]> = { ...current.markers }
  for (const [date, incomingMarkers] of Object.entries(incoming.markers)) {
    const incomingIds = new Set(incomingMarkers.map((marker) => marker.id))
    markers[date] = [...(markers[date] ?? []).filter((marker) => !incomingIds.has(marker.id)), ...incomingMarkers]
  }

  return { ranges, tasks, weeklyGoals, markers, dailyNotes }
}
