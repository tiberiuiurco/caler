import { useEffect, useRef } from 'react'
import { usePlannerStore } from '../store/plannerStore'
import { formatHour } from '../lib/date'
import type { Task } from '../types'

interface TaskSidebarProps {
  task: Task
  onClose: () => void
}

export function TaskSidebar({ task, onClose }: TaskSidebarProps) {
  const updateTask = usePlannerStore((state) => state.updateTask)
  const deleteTask = usePlannerStore((state) => state.deleteTask)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    titleRef.current?.select()
  }, [task.id])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
          ref={titleRef}
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

      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>{formatHour(task.start)}</span>
        <span>→</span>
        <span>{formatHour(task.start + task.duration)}</span>
        <span className="ml-auto">{task.duration}h</span>
      </div>

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
        Tip: double-right-click a task to delete it instantly.
      </p>
    </aside>
  )
}
