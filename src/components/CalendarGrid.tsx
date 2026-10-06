import type { ReactNode } from 'react'
import { CalendarColumn } from './CalendarColumn'
import { HOVER_TOOLBAR_ANCHOR, HoverToolbar } from './HoverToolbar'
import { HOUR_HEIGHT, TOTAL_HOURS } from '../lib/constants'
import type { DateKey, DayRange, Marker, Task } from '../types'

export interface CalendarColumnData {
  date: DateKey
  label: string
  sublabel?: string
  range?: DayRange
  tasks: Task[]
  markers?: Marker[]
  /** Unsaved marker drawn faded while it's being typed into the marker prompt. */
  markerPreview?: { hour: number; label: string }
  muted?: boolean
}

/** An action offered in the floating toolbar that appears when hovering a day's column header. */
export interface DayAction {
  id: string
  /** Tooltip / accessible name, e.g. "Delete all entries for Today". */
  label: (column: CalendarColumnData) => string
  icon: ReactNode
  tone?: 'default' | 'danger'
  /** When provided and false, the action is left out for that day (e.g. nothing to delete). */
  isAvailable?: (column: CalendarColumnData) => boolean
  onSelect: (column: CalendarColumnData) => void
}

interface CalendarGridProps {
  columns: CalendarColumnData[]
  selectedTaskId: string | null
  onSelectTask: (task: Task) => void
  /** Date currently targeted by the quick-add planning flow, highlighted in the header when set. */
  planningDate?: DateKey | null
  /** When provided, clicking a column's header drops that date into the quick-add planning flow. */
  onSelectPlanningDate?: (date: DateKey) => void
  /** Notified after a task is dragged to a new time (and/or day), so callers can keep selection in sync. */
  onTaskMoved?: (task: Task, newDate: DateKey, newStart: number) => void
  /** Per-day actions revealed in a floating toolbar below each column header on hover/focus. */
  dayActions?: DayAction[]
}

const GUTTER_WIDTH = 56

/** Shared hour-by-hour grid (0-24) used by both the day view and the week view. */
export function CalendarGrid({ columns, selectedTaskId, onSelectTask, planningDate, onSelectPlanningDate, onTaskMoved, dayActions = [] }: CalendarGridProps) {
  return (
    <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* z-40 keeps the header (and its floating day toolbars) above every layer inside the day columns. */}
      <div className="flex border-b border-neutral-200 bg-white/90 backdrop-blur sticky top-0 z-40 dark:border-neutral-800 dark:bg-neutral-950/90">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
        {columns.map((column) => {
          const isPlanning = onSelectPlanningDate && column.date === planningDate
          return (
            <div key={column.date} className={`${HOVER_TOOLBAR_ANCHOR} flex flex-1 border-l border-neutral-100 dark:border-neutral-800/70`}>
              <button
                type="button"
                disabled={!onSelectPlanningDate}
                onClick={() => onSelectPlanningDate?.(column.date)}
                title={onSelectPlanningDate ? `Plan ${column.label}` : undefined}
                // Highlighted while anywhere in the anchor is hovered (toolbar included), whether or not the header itself is clickable.
                className={`flex-1 py-2 text-center transition group-hover/hover-toolbar:bg-neutral-100 dark:group-hover/hover-toolbar:bg-neutral-800/60 ${
                  onSelectPlanningDate ? 'cursor-pointer' : 'cursor-default'
                } ${isPlanning ? 'bg-neutral-100 dark:bg-neutral-800/60' : ''}`}
              >
                <div className={`text-sm font-medium ${column.muted ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                  {column.label}
                </div>
                {column.sublabel && <div className="text-[11px] text-neutral-400 dark:text-neutral-500">{column.sublabel}</div>}
              </button>
              <HoverToolbar
                actions={dayActions
                  .filter((action) => action.isAvailable?.(column) ?? true)
                  .map((action) => ({
                    id: action.id,
                    label: action.label(column),
                    icon: action.icon,
                    tone: action.tone,
                    onClick: () => action.onSelect(column),
                  }))}
              />
            </div>
          )
        })}
      </div>

      <div className="flex">
        <div className="relative shrink-0" style={{ width: GUTTER_WIDTH, height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {Array.from({ length: TOTAL_HOURS }, (_, hour) => (
            <span
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-[11px] text-neutral-400 dark:text-neutral-500"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              {String(hour).padStart(2, '0')}:00
            </span>
          ))}
        </div>
        {columns.map((column) => (
          <div key={column.date} className="flex-1 border-l border-neutral-100 dark:border-neutral-800/70">
            <CalendarColumn
              date={column.date}
              range={column.range}
              tasks={column.tasks}
              markers={column.markers}
              markerPreview={column.markerPreview}
              selectedTaskId={selectedTaskId}
              onSelectTask={onSelectTask}
              onTaskMoved={onTaskMoved}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
