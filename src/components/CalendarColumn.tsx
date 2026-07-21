import { useRef, useState } from 'react'
import { usePlannerStore } from '../store/plannerStore'
import { TaskBlock } from './TaskBlock'
import { HOUR_HEIGHT, SNAP_HOURS, TOTAL_HOURS } from '../lib/constants'
import { todayKey } from '../lib/date'
import type { DateKey, DayRange, Task } from '../types'

interface CalendarColumnProps {
  date: DateKey
  range?: DayRange
  tasks: Task[]
  selectedTaskId: string | null
  onSelectTask: (task: Task) => void
}

interface Selection {
  startHour: number
  endHour: number
}

function clampHour(hour: number): number {
  return Math.min(TOTAL_HOURS, Math.max(0, hour))
}

function snapHour(hour: number): number {
  return Math.round(hour / SNAP_HOURS) * SNAP_HOURS
}

/** A single day's hour-by-hour column: renders tasks and supports click-drag task creation. */
export function CalendarColumn({ date, range, tasks, selectedTaskId, onSelectTask }: CalendarColumnProps) {
  const addTask = usePlannerStore((state) => state.addTask)
  const columnRef = useRef<HTMLDivElement>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [draft, setDraft] = useState<{ start: number; duration: number } | null>(null)
  const [draftValue, setDraftValue] = useState('')

  function hourFromClientY(clientY: number): number {
    const rect = columnRef.current!.getBoundingClientRect()
    return clampHour((clientY - rect.top) / HOUR_HEIGHT)
  }

  function handleMouseDown(event: React.MouseEvent) {
    if (event.button !== 0 || draft) return
    const startHour = snapHour(hourFromClientY(event.clientY))
    setSelection({ startHour, endHour: startHour })

    function handleMouseMove(moveEvent: MouseEvent) {
      const endHour = snapHour(hourFromClientY(moveEvent.clientY))
      setSelection((current) => (current ? { ...current, endHour } : current))
    }
    function handleMouseUp(upEvent: MouseEvent) {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      const endHour = snapHour(hourFromClientY(upEvent.clientY))
      setSelection((current) => {
        if (!current) return null
        const start = Math.min(current.startHour, endHour)
        const end = Math.max(current.startHour, endHour)
        const duration = Math.max(SNAP_HOURS, end - start)
        setDraft({ start, duration })
        setDraftValue(`${duration} `)
        return null
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  function commitDraft(input: string) {
    const match = /^\s*(\d+(?:\.\d+)?)\s+(.+?)\s*$/.exec(input)
    if (draft && match) {
      addTask(date, draft.start, Number.parseFloat(match[1]), match[2])
    }
    setDraft(null)
  }

  const visibleSelection =
    selection && Math.abs(selection.endHour - selection.startHour) > 0.01
      ? { start: Math.min(selection.startHour, selection.endHour), end: Math.max(selection.startHour, selection.endHour) }
      : null

  const isToday = date === todayKey()
  const now = new Date()
  const nowHour = now.getHours() + now.getMinutes() / 60

  return (
    <div
      ref={columnRef}
      onMouseDown={handleMouseDown}
      className="relative flex-1 select-none"
      style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
    >
      {Array.from({ length: TOTAL_HOURS }, (_, hour) => (
        <div
          key={hour}
          className="border-t border-neutral-100 dark:border-neutral-800/70"
          style={{ height: HOUR_HEIGHT }}
        />
      ))}

      {range && (
        <div
          className="absolute inset-x-0 bg-neutral-50 dark:bg-neutral-900/40"
          style={{ top: range.start * HOUR_HEIGHT, height: (range.end - range.start) * HOUR_HEIGHT, zIndex: 0 }}
        />
      )}

      {isToday && nowHour >= 0 && nowHour <= TOTAL_HOURS && (
        <div className="absolute inset-x-0 z-20 flex items-center" style={{ top: nowHour * HOUR_HEIGHT }}>
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          <div className="h-px flex-1 bg-red-500" />
        </div>
      )}

      {visibleSelection && (
        <div
          className="absolute inset-x-1 rounded-lg border-2 border-dashed border-neutral-400 bg-neutral-200/40 dark:border-neutral-500 dark:bg-neutral-700/30"
          style={{ top: visibleSelection.start * HOUR_HEIGHT, height: (visibleSelection.end - visibleSelection.start) * HOUR_HEIGHT }}
        />
      )}

      {draft && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            commitDraft(draftValue)
          }}
          className="absolute inset-x-1 z-30 rounded-lg border border-neutral-300 bg-white p-1.5 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
          style={{ top: draft.start * HOUR_HEIGHT }}
        >
          <input
            autoFocus
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onBlur={() => setDraft(null)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setDraft(null)
            }}
            placeholder="DURATION TEXT, e.g. 1.5 Write report"
            className="w-full bg-transparent text-xs outline-none"
          />
        </form>
      )}

      {tasks.map((task) => (
        <TaskBlock key={task.id} task={task} selected={task.id === selectedTaskId} onSelect={onSelectTask} />
      ))}
    </div>
  )
}
