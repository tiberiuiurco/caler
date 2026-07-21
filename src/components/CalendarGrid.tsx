import { CalendarColumn } from './CalendarColumn'
import { HOUR_HEIGHT, TOTAL_HOURS } from '../lib/constants'
import type { DateKey, DayRange, Task } from '../types'

export interface CalendarColumnData {
  date: DateKey
  label: string
  sublabel?: string
  range?: DayRange
  tasks: Task[]
  muted?: boolean
}

interface CalendarGridProps {
  columns: CalendarColumnData[]
  selectedTaskId: string | null
  onSelectTask: (task: Task) => void
  /** Date currently targeted by the quick-add planning flow, highlighted in the header when set. */
  planningDate?: DateKey | null
  /** When provided, clicking a column's header drops that date into the quick-add planning flow. */
  onSelectPlanningDate?: (date: DateKey) => void
}

const GUTTER_WIDTH = 56

/** Shared hour-by-hour grid (0-24) used by both the day view and the week view. */
export function CalendarGrid({ columns, selectedTaskId, onSelectTask, planningDate, onSelectPlanningDate }: CalendarGridProps) {
  return (
    <div className="flex-1 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex border-b border-neutral-200 bg-white/90 backdrop-blur sticky top-0 z-20 dark:border-neutral-800 dark:bg-neutral-950/90">
        <div style={{ width: GUTTER_WIDTH }} className="shrink-0" />
        {columns.map((column) => {
          const isPlanning = onSelectPlanningDate && column.date === planningDate
          return (
            <button
              key={column.date}
              type="button"
              disabled={!onSelectPlanningDate}
              onClick={() => onSelectPlanningDate?.(column.date)}
              title={onSelectPlanningDate ? `Plan ${column.label}` : undefined}
              className={`flex-1 border-l border-neutral-100 py-2 text-center dark:border-neutral-800/70 ${
                onSelectPlanningDate ? 'cursor-pointer transition hover:bg-neutral-100 dark:hover:bg-neutral-800/60' : 'cursor-default'
              } ${isPlanning ? 'bg-neutral-100 dark:bg-neutral-800/60' : ''}`}
            >
              <div className={`text-sm font-medium ${column.muted ? 'text-neutral-400 dark:text-neutral-500' : 'text-neutral-900 dark:text-neutral-100'}`}>
                {column.label}
              </div>
              {column.sublabel && <div className="text-[11px] text-neutral-400 dark:text-neutral-500">{column.sublabel}</div>}
            </button>
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
              selectedTaskId={selectedTaskId}
              onSelectTask={onSelectTask}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
