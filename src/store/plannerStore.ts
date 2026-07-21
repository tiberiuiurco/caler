import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DateKey, DayRange, DragPreview, Task, Theme } from '../types'
import { LOCAL_STORAGE_KEY, SNAP_HOURS } from '../lib/constants'
import { createId } from '../lib/id'

export interface PlannerState {
  theme: Theme
  ranges: Record<DateKey, DayRange>
  tasks: Record<DateKey, Task[]>
  /** Hour cursor for sequential quick-add, per day. */
  quickAddCursor: Record<DateKey, number>
  /** Live preview of a task currently being dragged, so any day column can render its drop target. */
  dragPreview: DragPreview | null

  toggleTheme: () => void
  setRange: (date: DateKey, range: DayRange) => void
  addTask: (date: DateKey, start: number, duration: number, title: string) => Task
  updateTask: (id: string, date: DateKey, patch: Partial<Pick<Task, 'title' | 'description' | 'start' | 'duration'>>) => void
  /** Moves a task to `toDate`/`patch.start` (and optionally a new duration), reparenting it between days when `toDate` differs from `fromDate`. */
  moveTask: (id: string, fromDate: DateKey, toDate: DateKey, patch: { start: number; duration?: number }) => void
  deleteTask: (id: string, date: DateKey) => void
  setQuickAddCursor: (date: DateKey, cursor: number) => void
  setDragPreview: (preview: DragPreview | null) => void
  importData: (data: { ranges: Record<DateKey, DayRange>; tasks: Record<DateKey, Task[]> }) => void
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

      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      setRange: (date, range) =>
        set((state) => ({
          ranges: { ...state.ranges, [date]: range },
          quickAddCursor: { ...state.quickAddCursor, [date]: range.start },
        })),

      addTask: (date, start, duration, title) => {
        const task: Task = { id: createId(), date, start: snap(start), duration: snap(duration), title, description: '' }
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

      setQuickAddCursor: (date, cursor) =>
        set((state) => ({ quickAddCursor: { ...state.quickAddCursor, [date]: cursor } })),

      setDragPreview: (preview) => set({ dragPreview: preview }),

      importData: (data) => set({ ranges: data.ranges, tasks: data.tasks }),
    }),
    {
      name: LOCAL_STORAGE_KEY,
      partialize: (state) => ({
        theme: state.theme,
        ranges: state.ranges,
        tasks: state.tasks,
        quickAddCursor: state.quickAddCursor,
      }),
    },
  ),
)
