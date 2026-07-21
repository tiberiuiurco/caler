import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { RangeModal } from './components/RangeModal'
import { QuickAddBar } from './components/QuickAddBar'
import { TaskSidebar } from './components/TaskSidebar'
import { CalendarGrid, type CalendarColumnData } from './components/CalendarGrid'
import { usePlannerStore } from './store/plannerStore'
import { useTheme } from './hooks/useTheme'
import { exportPlannerData } from './lib/exportData'
import { formatDayLabel, formatWeekdayShort, shiftKey, todayKey, weekKeys } from './lib/date'
import type { DateKey, Task } from './types'

export default function App() {
  useTheme()

  const ranges = usePlannerStore((state) => state.ranges)
  const tasks = usePlannerStore((state) => state.tasks)
  const quickAddCursor = usePlannerStore((state) => state.quickAddCursor)
  const setRange = usePlannerStore((state) => state.setRange)
  const addTask = usePlannerStore((state) => state.addTask)
  const setQuickAddCursor = usePlannerStore((state) => state.setQuickAddCursor)

  const today = todayKey()
  const yesterday = shiftKey(today, -1)
  const todayRange = ranges[today]

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [weekAnchor, setWeekAnchor] = useState<DateKey>(today)
  const [quickAddActive, setQuickAddActive] = useState(false)
  const [selected, setSelected] = useState<{ id: string; date: DateKey } | null>(null)

  // As soon as today's active range exists, drop straight into sequential quick-add.
  const hasTodayRange = Boolean(todayRange)
  useEffect(() => {
    if (hasTodayRange) setQuickAddActive(true)
  }, [hasTodayRange])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      if (isTyping) return
      if (event.key === 't' || event.key === 'T') usePlannerStore.getState().toggleTheme()
      if (event.key === 'w' || event.key === 'W') setViewMode((mode) => (mode === 'day' ? 'week' : 'day'))
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const selectedTask: Task | null = useMemo(() => {
    if (!selected) return null
    return tasks[selected.date]?.find((task) => task.id === selected.id) ?? null
  }, [selected, tasks])

  function handleQuickAddSubmit(duration: number, title: string) {
    if (!todayRange) return
    const cursor = quickAddCursor[today] ?? todayRange.start
    addTask(today, cursor, duration, title)
    const next = cursor + duration
    setQuickAddCursor(today, next)
    if (next >= todayRange.end) setQuickAddActive(false)
  }

  const dayColumns: CalendarColumnData[] = [
    { date: yesterday, label: 'Yesterday', sublabel: formatDayLabel(yesterday), range: ranges[yesterday], tasks: tasks[yesterday] ?? [], muted: true },
    { date: today, label: 'Today', sublabel: formatDayLabel(today), range: todayRange, tasks: tasks[today] ?? [] },
  ]

  const weekColumns: CalendarColumnData[] = weekKeys(weekAnchor).map((date) => ({
    date,
    label: formatWeekdayShort(date),
    range: ranges[date],
    tasks: tasks[date] ?? [],
    muted: date !== today,
  }))

  const cursor = quickAddCursor[today] ?? todayRange?.start ?? 0
  const showContinueButton = Boolean(todayRange) && !quickAddActive && cursor < (todayRange?.end ?? 0)

  return (
    <div className="flex h-screen flex-col">
      {!todayRange && <RangeModal onConfirm={(start, end) => setRange(today, { start, end })} />}

      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        weekAnchor={weekAnchor}
        onWeekAnchorChange={setWeekAnchor}
        onExport={() => exportPlannerData({ ranges, tasks })}
      />

      {viewMode === 'day' && todayRange && quickAddActive && (
        <QuickAddBar
          cursor={cursor}
          rangeEnd={todayRange.end}
          onSubmit={handleQuickAddSubmit}
          onDismiss={() => setQuickAddActive(false)}
        />
      )}

      {viewMode === 'day' && showContinueButton && (
        <div className="mx-5 mt-3">
          <button
            type="button"
            onClick={() => setQuickAddActive(true)}
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            + Continue adding tasks
          </button>
        </div>
      )}

      <div className="flex flex-1 gap-0 overflow-hidden p-5 pt-3">
        <CalendarGrid
          columns={viewMode === 'day' ? dayColumns : weekColumns}
          selectedTaskId={selected?.id ?? null}
          onSelectTask={(task) => setSelected({ id: task.id, date: task.date })}
        />
        {selectedTask && <TaskSidebar task={selectedTask} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}
