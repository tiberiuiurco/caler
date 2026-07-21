import { usePlannerStore } from '../store/plannerStore'
import { formatHour, parseTimeToHours } from '../lib/date'
import { SNAP_HOURS } from '../lib/constants'
import type { Task } from '../types'

interface TaskSidebarProps {
  task: Task
  onClose: () => void
}

/** Clamps 24:00 (midnight rollover) down to a value <input type="time"> accepts. */
function toTimeInputValue(hour: number): string {
  return hour >= 24 ? '23:59' : formatHour(hour)
}

// Escape-to-close and other shortcuts are handled centrally in App so they compose
// correctly with the delete-confirmation dialog instead of racing separate listeners.
export function TaskSidebar({ task, onClose }: TaskSidebarProps) {
  const updateTask = usePlannerStore((state) => state.updateTask)
  const deleteTask = usePlannerStore((state) => state.deleteTask)

  function handleStartChange(value: string) {
    const newStart = parseTimeToHours(value)
    if (newStart === null) return
    const end = task.start + task.duration
    const duration = Math.max(SNAP_HOURS, end - newStart)
    updateTask(task.id, task.date, { start: newStart, duration })
  }

  function handleEndChange(value: string) {
    const newEnd = parseTimeToHours(value)
    if (newEnd === null) return
    const duration = Math.max(SNAP_HOURS, newEnd - task.start)
    updateTask(task.id, task.date, { duration })
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 border-l border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Edit task</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-7 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          ✕
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Title</span>
        <input
          value={task.title}
          onChange={(event) => updateTask(task.id, task.date, { title: event.target.value })}
          className="rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Description</span>
        <textarea
          value={task.description}
          onChange={(event) => updateTask(task.id, task.date, { description: event.target.value })}
          rows={6}
          placeholder="Add more detail…"
          className="resize-none rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
        />
      </label>

      <div className="flex items-center gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Start</span>
          <input
            type="time"
            value={toTimeInputValue(task.start)}
            onChange={(event) => handleStartChange(event.target.value)}
            className="rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">End</span>
          <input
            type="time"
            value={toTimeInputValue(task.start + task.duration)}
            onChange={(event) => handleEndChange(event.target.value)}
            className="rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-neutral-400 dark:text-neutral-500">{task.duration}h duration</p>

      <button
        type="button"
        onClick={() => {
          deleteTask(task.id, task.date)
          onClose()
        }}
        className="mt-auto rounded-lg border border-red-200 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40"
      >
        Delete task
      </button>
      <p className="text-center text-[11px] text-neutral-400 dark:text-neutral-500">
        Tip: double-right-click, or select and press "x", to delete a task.
      </p>
    </aside>
  )
}

