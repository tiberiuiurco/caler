import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DateKey, DayRange, DragPreview, Task, Theme } from '../types'
import { LOCAL_STORAGE_KEY, SNAP_HOURS } from '../lib/constants'
import { createId } from '../lib/id'
import { mergePlannerData, type ParsedPlannerData } from '../lib/importData'

export interface PlannerState {
  theme: Theme
  ranges: Record<DateKey, DayRange>
  tasks: Record<DateKey, Task[]>
  /**
   * Hour cursor for sequential quick-add, per day. Only meaningful while the composer is open: it
   * carries in-session "skip ahead" gaps, and is reset whenever the composer closes so it reopens
   * from the real schedule. Not persisted.
   */
  quickAddCursor: Record<DateKey, number>
  /** Live preview of a task currently being dragged, so any day column can render its drop target. */
  dragPreview: DragPreview | null
  /** Markdown weekly goals, keyed by that week's Monday date (see `weekStartKey`). */
  weeklyGoals: Record<DateKey, string>
  /** Whether the weekly goals sidebar is expanded (vs. collapsed to a thin strip). Expanded by default. */
  weeklyGoalsExpanded: boolean

  toggleTheme: () => void
  setRange: (date: DateKey, range: DayRange) => void
  addTask: (date: DateKey, start: number, duration: number, title: string, isDeepWork?: boolean) => Task
  updateTask: (id: string, date: DateKey, patch: Partial<Pick<Task, 'title' | 'description' | 'start' | 'duration' | 'isDeepWork'>>) => void
  /** Moves a task to `toDate`/`patch.start` (and optionally a new duration), reparenting it between days when `toDate` differs from `fromDate`. */
  moveTask: (id: string, fromDate: DateKey, toDate: DateKey, patch: { start: number; duration?: number }) => void
  deleteTask: (id: string, date: DateKey) => void
  /** Removes every task on `date` and rewinds its quick-add cursor to the start of the day's range. Other days are untouched. */
  clearDay: (date: DateKey) => void
  setQuickAddCursor: (date: DateKey, cursor: number) => void
  /** Drops every tracked quick-add cursor, so the composer falls back to the day's actual last task end. */
  resetQuickAddCursors: () => void
  setDragPreview: (preview: DragPreview | null) => void
  setWeeklyGoals: (weekStart: DateKey, markdown: string) => void
  setWeeklyGoalsExpanded: (expanded: boolean) => void
  importData: (data: ParsedPlannerData, mode: 'replace' | 'merge') => void
  clearAllData: () => void
}

function snap(value: number): number {
  return Math.round(value / SNAP_HOURS) * SNAP_HOURS
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      theme: 'dark',
      ranges: {},
      tasks: {},
      quickAddCursor: {},
      dragPreview: null,
      weeklyGoals: {},
      weeklyGoalsExpanded: true,

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setRange: (date, range) =>
        set((state) => ({
          ranges: { ...state.ranges, [date]: range },
          quickAddCursor: { ...state.quickAddCursor, [date]: range.start },
        })),

      addTask: (date, start, duration, title, isDeepWork = false) => {
        const task: Task = { id: createId(), date, start: snap(start), duration: snap(duration), title, description: '', isDeepWork }
        set((state) => ({
          tasks: { ...state.tasks, [date]: [...(state.tasks[date] ?? []), task] },
        }))
        return task
      },

      updateTask: (id, date, patch) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [date]: (state.tasks[date] ?? []).map((task) =>
              task.id === id
                ? {
                    ...task,
                    ...patch,
                    ...(patch.start !== undefined ? { start: snap(patch.start) } : {}),
                    ...(patch.duration !== undefined ? { duration: snap(patch.duration) } : {}),
                  }
                : task,
            ),
          },
        })),

      moveTask: (id, fromDate, toDate, patch) =>
        set((state) => {
          const source = state.tasks[fromDate] ?? []
          const task = source.find((existing) => existing.id === id)
          if (!task) return {}

          const moved: Task = {
            ...task,
            date: toDate,
            start: snap(patch.start),
            duration: patch.duration !== undefined ? snap(patch.duration) : task.duration,
          }

          if (fromDate === toDate) {
            return { tasks: { ...state.tasks, [fromDate]: source.map((existing) => (existing.id === id ? moved : existing)) } }
          }

          return {
            tasks: {
              ...state.tasks,
              [fromDate]: source.filter((existing) => existing.id !== id),
              [toDate]: [...(state.tasks[toDate] ?? []), moved],
            },
          }
        }),

      deleteTask: (id, date) =>
        set((state) => ({
          tasks: { ...state.tasks, [date]: (state.tasks[date] ?? []).filter((task) => task.id !== id) },
        })),

      clearDay: (date) =>
        set((state) => {
          const { [date]: _cleared, ...tasks } = state.tasks
          const { [date]: _cursor, ...quickAddCursor } = state.quickAddCursor
          return { tasks, quickAddCursor }
        }),

      setQuickAddCursor: (date, cursor) =>
        set((state) => ({ quickAddCursor: { ...state.quickAddCursor, [date]: cursor } })),

      resetQuickAddCursors: () => set({ quickAddCursor: {} }),

      setDragPreview: (preview) => set({ dragPreview: preview }),

      setWeeklyGoals: (weekStart, markdown) =>
        set((state) => ({ weeklyGoals: { ...state.weeklyGoals, [weekStart]: markdown } })),

      setWeeklyGoalsExpanded: (expanded) => set({ weeklyGoalsExpanded: expanded }),

      importData: (data, mode) =>
        set((state) => {
          const snapped: ParsedPlannerData = {
            ranges: data.ranges,
            weeklyGoals: data.weeklyGoals,
            tasks: Object.fromEntries(
              Object.entries(data.tasks).map(([date, tasks]) => [
                date,
                tasks.map((task) => ({ ...task, start: snap(task.start), duration: snap(task.duration) })),
              ]),
            ),
          }

          const merged =
            mode === 'merge'
              ? mergePlannerData({ ranges: state.ranges, tasks: state.tasks, weeklyGoals: state.weeklyGoals }, snapped)
              : snapped

          return { ranges: merged.ranges, tasks: merged.tasks, weeklyGoals: merged.weeklyGoals, quickAddCursor: {} }
        }),

      clearAllData: () => set({ ranges: {}, tasks: {}, weeklyGoals: {}, quickAddCursor: {} }),
    }),
    {
      name: LOCAL_STORAGE_KEY,
      partialize: (state) => ({
        theme: state.theme,
        ranges: state.ranges,
        tasks: state.tasks,
        weeklyGoals: state.weeklyGoals,
        weeklyGoalsExpanded: state.weeklyGoalsExpanded,
      }),
    },
  ),
)
