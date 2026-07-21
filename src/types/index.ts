/** ISO date key in the form `YYYY-MM-DD`, always in the user's local timezone. */
export type DateKey = string

export interface Task {
  id: string
  date: DateKey
  /** Hours from midnight, e.g. 9.5 == 09:30. */
  start: number
  /** Duration in hours, e.g. 1.5 == 90 minutes. */
  duration: number
  title: string
  description: string
}

export interface DayRange {
  /** Inclusive start hour, 0-24. */
  start: number
  /** Exclusive end hour, 0-24. */
  end: number
}

export type Theme = 'light' | 'dark'

/** Live preview of an in-progress drag, shared through the store so any day column can render it. */
export interface DragPreview {
  taskId: string
  date: DateKey
  start: number
  duration: number
}

export interface QuickAddState {
  active: boolean
  /** Hour cursor where the next quick-added task will begin. */
  cursor: number
}
