import { useRef, useState } from 'react'
import { usePlannerStore } from '../store/plannerStore'
import { useDoubleRightClick } from '../hooks/useDoubleRightClick'
import { HOUR_HEIGHT, SNAP_HOURS, TOTAL_HOURS } from '../lib/constants'
import { formatHour } from '../lib/date'
import type { DateKey, Task } from '../types'

interface TaskBlockProps {
  task: Task
  selected: boolean
  onSelect: (task: Task) => void
  /** Left offset/width (percentage of the column) assigned by the overlap layout. */
  left: number
  width: number
  /** Notified after a drag-and-drop move commits, so the caller can keep selection in sync. */
  onMoved?: (task: Task, newDate: DateKey, newStart: number) => void
}

interface DragGhost {
  x: number
  y: number
  width: number
  height: number
}

/** Ignore tiny mouse jitter on a plain click so it doesn't get mistaken for a drag. */
const DRAG_THRESHOLD_PX = 4

export function TaskBlock({ task, selected, onSelect, left, width, onMoved }: TaskBlockProps) {
  const updateTask = usePlannerStore((state) => state.updateTask)
  const moveTask = usePlannerStore((state) => state.moveTask)
  const deleteTask = usePlannerStore((state) => state.deleteTask)
  const setDragPreview = usePlannerStore((state) => state.setDragPreview)
  const [liveDuration, setLiveDuration] = useState<number | null>(null)
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null)
  const resizingRef = useRef(false)
  const suppressClickRef = useRef(false)

  const handleContextMenu = useDoubleRightClick(() => deleteTask(task.id, task.date))

  const duration = liveDuration ?? task.duration

  function handleResizeStart(event: React.MouseEvent) {
    // Only the left button starts a resize; a right-click here (e.g. on a short task, where the
    // resize handle strip covers more of its height) must fall through to the native contextmenu
    // event untouched, or double-right-click-to-delete stops working (calling preventDefault on a
    // right-button mousedown suppresses the subsequent contextmenu event in Firefox/Gecko).
    if (event.button !== 0) return
    event.stopPropagation()
    event.preventDefault()
    resizingRef.current = true
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
      resizingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  /** Drags the task's body to change its start time (and day, dragging across columns). */
  function handleBodyMouseDown(event: React.MouseEvent) {
    // Leave right-clicks (and any other non-left button) alone so they reach the native
    // contextmenu event untouched, for double-right-click-to-delete.
    if (event.button !== 0) return
    event.stopPropagation()

    const blockRect = event.currentTarget.getBoundingClientRect()
    const grabOffsetX = event.clientX - blockRect.left
    const grabOffsetY = event.clientY - blockRect.top
    const startClientX = event.clientX
    const startClientY = event.clientY

    let moved = false
    let target: { date: DateKey; start: number } = { date: task.date, start: task.start }

    function handleMouseMove(moveEvent: MouseEvent) {
      if (!moved) {
        const dx = moveEvent.clientX - startClientX
        const dy = moveEvent.clientY - startClientY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        moved = true
      }

      const boxLeft = moveEvent.clientX - grabOffsetX
      const boxTop = moveEvent.clientY - grabOffsetY
      setDragGhost({ x: boxLeft, y: boxTop, width: blockRect.width, height: blockRect.height })

      const under = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null
      const columnEl = under?.closest<HTMLElement>('[data-date-column]')
      if (!columnEl) return
      const date = columnEl.dataset.dateColumn as DateKey
      const columnRect = columnEl.getBoundingClientRect()
      const rawStart = (boxTop - columnRect.top) / HOUR_HEIGHT
      const clampedStart = Math.min(TOTAL_HOURS - task.duration, Math.max(0, rawStart))
      const start = Math.round(clampedStart / SNAP_HOURS) * SNAP_HOURS
      target = { date, start }
      setDragPreview({ taskId: task.id, date, start, duration: task.duration })
    }

    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      setDragGhost(null)
      setDragPreview(null)
      if (moved) {
        // The browser fires a trailing click right after this mouseup; swallow just that one
        // so a completed drag doesn't also select/open the task.
        suppressClickRef.current = true
        if (target.date !== task.date || target.start !== task.start) {
          moveTask(task.id, task.date, target.date, { start: target.start })
          onMoved?.(task, target.date, target.start)
        }
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        style={{
          top: task.start * HOUR_HEIGHT,
          height: duration * HOUR_HEIGHT,
          left: `calc(${left}% + 4px)`,
          width: `calc(${width}% - 8px)`,
          opacity: dragGhost ? 0.35 : undefined,
        }}
        onMouseDown={handleBodyMouseDown}
        onClick={(event) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            return
          }
          if (resizingRef.current) return
          event.stopPropagation()
          onSelect(task)
        }}
        onContextMenu={handleContextMenu}
        className={`group absolute flex flex-col overflow-hidden rounded-lg border px-2 py-1 text-left transition ${
          dragGhost ? 'cursor-grabbing' : 'cursor-grab'
        } ${
          selected
            ? 'z-10 border-neutral-900 bg-neutral-900 text-white shadow-md dark:border-white dark:bg-white dark:text-neutral-900'
            : 'border-sky-200 bg-sky-50 text-sky-900 hover:border-sky-300 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-100'
        }`}
      >
        <span className="truncate text-xs font-medium">{task.title || 'Untitled task'}</span>
        {duration * HOUR_HEIGHT > 30 && (
          <span className="truncate text-[11px] opacity-70">
            {formatHour(task.start)} – {formatHour(task.start + duration)}
          </span>
        )}
        <div
          onMouseDown={handleResizeStart}
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-row-resize opacity-0 transition group-hover:opacity-100"
        >
          <div className="mx-auto mt-0.5 h-0.5 w-8 rounded-full bg-current opacity-50" />
        </div>
      </div>

      {dragGhost && (
        <div
          className="pointer-events-none fixed z-50 flex flex-col overflow-hidden rounded-lg border border-neutral-900 bg-neutral-900/90 px-2 py-1 text-left text-white shadow-xl dark:border-white dark:bg-white/90 dark:text-neutral-900"
          style={{ left: dragGhost.x, top: dragGhost.y, width: dragGhost.width, height: dragGhost.height }}
        >
          <span className="truncate text-xs font-medium">{task.title || 'Untitled task'}</span>
        </div>
      )}
    </>
  )
}
