import { useRef, useState } from 'react'
import { usePlannerStore } from '../store/plannerStore'
import { useDoubleRightClick } from '../hooks/useDoubleRightClick'
import { HOUR_HEIGHT, SNAP_HOURS } from '../lib/constants'
import { formatHour } from '../lib/date'
import type { Task } from '../types'

interface TaskBlockProps {
  task: Task
  selected: boolean
  onSelect: (task: Task) => void
}

export function TaskBlock({ task, selected, onSelect }: TaskBlockProps) {
  const updateTask = usePlannerStore((state) => state.updateTask)
  const deleteTask = usePlannerStore((state) => state.deleteTask)
  const [liveDuration, setLiveDuration] = useState<number | null>(null)
  const draggingRef = useRef(false)

  const handleContextMenu = useDoubleRightClick(() => deleteTask(task.id, task.date))

  const duration = liveDuration ?? task.duration

  function handleResizeStart(event: React.MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    draggingRef.current = true
    const startY = event.clientY
    const startDuration = task.duration

    function handleMouseMove(moveEvent: MouseEvent) {
      const deltaHours = (moveEvent.clientY - startY) / HOUR_HEIGHT
      const next = Math.max(SNAP_HOURS, Math.round((startDuration + deltaHours) / SNAP_HOURS) * SNAP_HOURS)
      setLiveDuration(next)
    }
    function handleMouseUp(upEvent: MouseEvent) {
      const deltaHours = (upEvent.clientY - startY) / HOUR_HEIGHT
      const next = Math.max(SNAP_HOURS, Math.round((startDuration + deltaHours) / SNAP_HOURS) * SNAP_HOURS)
      updateTask(task.id, task.date, { duration: next })
      setLiveDuration(null)
      draggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      style={{ top: task.start * HOUR_HEIGHT, height: duration * HOUR_HEIGHT }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        if (draggingRef.current) return
        event.stopPropagation()
        onSelect(task)
      }}
      onContextMenu={handleContextMenu}
      className={`group absolute inset-x-1 flex flex-col overflow-hidden rounded-lg border px-2 py-1 text-left transition ${
        selected
          ? 'z-10 border-neutral-900 bg-neutral-900 text-white shadow-md dark:border-white dark:bg-white dark:text-neutral-900'
          : 'border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100'
      }`}
    >
      <span className="truncate text-xs font-medium">{task.title || 'Untitled task'}</span>
      {duration * HOUR_HEIGHT > 30 && (
        <span className="truncate text-[11px] opacity-70">
          {formatHour(task.start)} · {duration}h
        </span>
      )}
      <div
        onMouseDown={handleResizeStart}
        className="absolute inset-x-0 bottom-0 h-1.5 cursor-row-resize opacity-0 transition group-hover:opacity-100"
      >
        <div className="mx-auto mt-0.5 h-0.5 w-8 rounded-full bg-current opacity-50" />
      </div>
    </div>
  )
}
