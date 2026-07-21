import { ThemeToggle } from './ThemeToggle'
import { formatDayLabel, shiftKey, weekKeys } from '../lib/date'
import type { DateKey } from '../types'

interface HeaderProps {
  viewMode: 'day' | 'week'
  onViewModeChange: (mode: 'day' | 'week') => void
  weekAnchor: DateKey
  onWeekAnchorChange: (key: DateKey) => void
  onExport: () => void
}

export function Header({ viewMode, onViewModeChange, weekAnchor, onWeekAnchorChange, onExport }: HeaderProps) {
  const week = weekKeys(weekAnchor)

  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
      <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Caler</h1>

      <div className="ml-2 flex rounded-full bg-neutral-100 p-0.5 text-sm dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => onViewModeChange('day')}
          className={`rounded-full px-3 py-1 transition ${
            viewMode === 'day'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          Day
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('week')}
          className={`rounded-full px-3 py-1 transition ${
            viewMode === 'week'
              ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
          }`}
        >
          Week
        </button>
      </div>

      {viewMode === 'week' && (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => onWeekAnchorChange(shiftKey(weekAnchor, -7))}
            className="grid size-7 place-items-center rounded-full transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ‹
          </button>
          <span className="tabular-nums">
            {formatDayLabel(week[0]).replace(/^\w+, /, '')} – {formatDayLabel(week[6]).replace(/^\w+, /, '')}
          </span>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => onWeekAnchorChange(shiftKey(weekAnchor, 7))}
            className="grid size-7 place-items-center rounded-full transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ›
          </button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          title="Export all data as JSON"
          className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Export
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
