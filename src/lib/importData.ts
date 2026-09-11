import type { DateKey, DayRange, Task } from '../types'

export interface ParsedPlannerData {
  ranges: Record<DateKey, DayRange>
  tasks: Record<DateKey, Task[]>
  weeklyGoals: Record<DateKey, string>
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
  const { id, date, start, duration, title, description } = value
  if (typeof id !== 'string' || typeof title !== 'string') return null
  if (!isFiniteNumber(start) || !isFiniteNumber(duration)) return null
  return {
    id,
    date: typeof date === 'string' ? date : fallbackDate,
    start,
    duration,
    title,
    description: typeof description === 'string' ? description : '',
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

  if (!isPlainObject(rawRanges)) return { ok: false, error: 'Missing or invalid "ranges" in the file.' }
  if (!isPlainObject(rawTasks)) return { ok: false, error: 'Missing or invalid "tasks" in the file.' }
  if (rawGoals !== undefined && !isPlainObject(rawGoals)) return { ok: false, error: 'Invalid "weeklyGoals" in the file.' }

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

  return {
    ok: true,
    data: { ranges, tasks, weeklyGoals },
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

  const tasks: Record<DateKey, Task[]> = { ...current.tasks }
  for (const [date, incomingTasks] of Object.entries(incoming.tasks)) {
    const existing = tasks[date] ?? []
    const incomingIds = new Set(incomingTasks.map((task) => task.id))
    tasks[date] = [...existing.filter((task) => !incomingIds.has(task.id)), ...incomingTasks]
  }

  return { ranges, tasks, weeklyGoals }
}
