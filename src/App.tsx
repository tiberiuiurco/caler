import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { RangeModal } from './components/RangeModal'
import { QuickAddBar } from './components/QuickAddBar'
import { TaskSidebar } from './components/TaskSidebar'
import { ConfirmDialog } from './components/ConfirmDialog'
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
  const deleteTask = usePlannerStore((state) => state.deleteTask)
  const setQuickAddCursor = usePlannerStore((state) => state.setQuickAddCursor)

  const today = todayKey()
  const yesterday = shiftKey(today, -1)
  const todayRange = ranges[today]

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [weekAnchor, setWeekAnchor] = useState<DateKey>(today)
  // Which date the quick-add bar is currently filling. Defaults to (and, in day view, always
  // stays) today; clicking a date's header in week view retargets it there instead.
  const [quickAddDate, setQuickAddDate] = useState<DateKey>(today)
  const [quickAddActive, setQuickAddActive] = useState(false)
  const [quickAddValue, setQuickAddValue] = useState('')
  const [quickAddFocusToken, setQuickAddFocusToken] = useState(0)
  const [selected, setSelected] = useState<{ id: string; date: DateKey } | null>(null)
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ id: string; date: DateKey; title: string } | null>(null)
  const [abandonEntryPending, setAbandonEntryPending] = useState<{ direction: 1 | -1 } | null>(null)

  const quickAddRange = ranges[quickAddDate]

  // As soon as the planning date's active range exists, drop straight into sequential quick-add.
  const hasQuickAddRange = Boolean(quickAddRange)
  useEffect(() => {
    if (hasQuickAddRange) setQuickAddActive(true)
  }, [hasQuickAddRange, quickAddDate])

  function handleViewModeChange(mode: 'day' | 'week') {
    setViewMode(mode)
    // Day view is always about today; leaving week view drops any other in-progress planning date.
    if (mode === 'day') setQuickAddDate(today)
  }

  // Clicking a date's header in week view enables the same sequential quick-add flow day view
  // gives today: prompting for an hour range first if that date doesn't have one yet.
  function handleSelectPlanningDate(date: DateKey) {
    setQuickAddDate(date)
    setQuickAddValue('')
    setQuickAddFocusToken((token) => token + 1)
    if (ranges[date]) setQuickAddActive(true)
  }

  const selectedTask: Task | null = useMemo(() => {
    if (!selected) return null
    return tasks[selected.date]?.find((task) => task.id === selected.id) ?? null
  }, [selected, tasks])

  // Selects the previous/next task (by start time) within the selected task's day, defaulting to
  // today and wrapping around at either end so up/down always has somewhere to go.
  const navigateSelection = useCallback(
    (direction: 1 | -1) => {
      const date = selectedTask?.date ?? today
      const dayTasks = [...(tasks[date] ?? [])].sort((a, b) => a.start - b.start)
      if (dayTasks.length === 0) return
      const currentIndex = selectedTask ? dayTasks.findIndex((task) => task.id === selectedTask.id) : -1
      const nextIndex =
        currentIndex === -1 ? (direction === 1 ? 0 : dayTasks.length - 1) : (currentIndex + direction + dayTasks.length) % dayTasks.length
      setSelected({ id: dayTasks[nextIndex].id, date })
    },
    [selectedTask, tasks, today],
  )

  // Global keyboard flow. Up/Down (and their w/s aliases) loop through tasks; Left/Right (and a/d)
  // page through weeks while in week view; q/e switch views; x requests task deletion; "." jumps
  // week view back to the current week.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const isTextarea = target.tagName === 'TEXTAREA'
      const isTimeInput = target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'time'
      const isTyping = target.tagName === 'INPUT' || isTextarea

      // Up/Down always navigate tasks, even while typing, except inside multi-line text or time
      // steppers where the arrow keys have their own native meaning.
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !isTextarea && !isTimeInput) {
        if (confirmDeleteTarget || abandonEntryPending) return
        const direction = event.key === 'ArrowUp' ? -1 : 1
        const isQuickAddField = target.getAttribute('data-nav-guard') === 'quickadd'
        event.preventDefault()
        if (isQuickAddField && (target as HTMLInputElement).value.trim() !== '') {
          setAbandonEntryPending({ direction })
        } else {
          navigateSelection(direction)
        }
        return
      }

      if (isTyping || confirmDeleteTarget || abandonEntryPending) return

      if (event.key === 'Escape') {
        if (selectedTask) setSelected(null)
        return
      }
      if (event.key === 't' || event.key === 'T') {
        usePlannerStore.getState().toggleTheme()
        return
      }
      if (event.key === 'q' || event.key === 'Q') {
        setViewMode('week')
        return
      }
      if (event.key === 'e' || event.key === 'E') {
        setViewMode('day')
        return
      }
      if (event.key === 'x' || event.key === 'X') {
        if (selectedTask) {
          event.preventDefault()
          setConfirmDeleteTarget({ id: selectedTask.id, date: selectedTask.date, title: selectedTask.title })
        }
        return
      }
      if (event.key === '.' && viewMode === 'week') {
        event.preventDefault()
        setWeekAnchor(today)
        return
      }
      if ((event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') && viewMode === 'week') {
        event.preventDefault()
        setWeekAnchor((anchor) => shiftKey(anchor, -7))
        return
      }
      if ((event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') && viewMode === 'week') {
        event.preventDefault()
        setWeekAnchor((anchor) => shiftKey(anchor, 7))
        return
      }
      if (event.key === 'w' || event.key === 'W') {
        navigateSelection(-1)
        return
      }
      if (event.key === 's' || event.key === 'S') {
        navigateSelection(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTask, tasks, viewMode, confirmDeleteTarget, abandonEntryPending, today, navigateSelection])

  function handleQuickAddSubmit(duration: number, title: string) {
    if (!quickAddRange) return
    const cursor = quickAddCursor[quickAddDate] ?? quickAddRange.start
    // A bare duration with no title just skips that stretch of time, no task is created.
    if (title.trim() !== '') addTask(quickAddDate, cursor, duration, title)
    const next = cursor + duration
    setQuickAddCursor(quickAddDate, next)
    setQuickAddValue('')
    if (next >= quickAddRange.end) setQuickAddActive(false)
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

  const cursor = quickAddCursor[quickAddDate] ?? quickAddRange?.start ?? 0
  const showContinueButton = Boolean(quickAddRange) && !quickAddActive && cursor < (quickAddRange?.end ?? 0)
  const quickAddDateLabel = quickAddDate === today ? undefined : formatDayLabel(quickAddDate)

  return (
    <div className="flex h-screen flex-col">
      {!quickAddRange && <RangeModal dateLabel={quickAddDateLabel} onConfirm={(start, end) => setRange(quickAddDate, { start, end })} />}

      {confirmDeleteTarget && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${confirmDeleteTarget.title || 'Untitled task'}" will be permanently removed.`}
          onConfirm={() => {
            deleteTask(confirmDeleteTarget.id, confirmDeleteTarget.date)
            setSelected(null)
            setConfirmDeleteTarget(null)
          }}
          onCancel={() => setConfirmDeleteTarget(null)}
        />
      )}

      {abandonEntryPending && (
        <ConfirmDialog
          title="Discard unsaved entry?"
          message="You've started typing a task but haven't added it yet. Moving on will discard it."
          confirmLabel="Discard"
          onConfirm={() => {
            const { direction } = abandonEntryPending
            setQuickAddValue('')
            setAbandonEntryPending(null)
            navigateSelection(direction)
          }}
          onCancel={() => {
            setAbandonEntryPending(null)
            setQuickAddFocusToken((token) => token + 1)
          }}
        />
      )}

      <Header
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        weekAnchor={weekAnchor}
        onWeekAnchorChange={setWeekAnchor}
        onExport={() => exportPlannerData({ ranges, tasks })}
      />

      {quickAddRange && quickAddActive && (
        <QuickAddBar
          cursor={cursor}
          rangeEnd={quickAddRange.end}
          dateLabel={quickAddDateLabel}
          value={quickAddValue}
          onValueChange={setQuickAddValue}
          onSubmit={handleQuickAddSubmit}
          onDismiss={() => setQuickAddActive(false)}
          focusToken={quickAddFocusToken}
          suppressBlurDismiss={Boolean(abandonEntryPending)}
        />
      )}

      {showContinueButton && (
        <div className="mx-5 mt-3">
          <button
            type="button"
            onClick={() => setQuickAddActive(true)}
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            + Continue adding tasks{quickAddDateLabel ? ` for ${quickAddDateLabel}` : ''}
          </button>
        </div>
      )}

      <div className="flex flex-1 gap-0 overflow-hidden p-5 pt-3">
        <CalendarGrid
          columns={viewMode === 'day' ? dayColumns : weekColumns}
          selectedTaskId={selected?.id ?? null}
          onSelectTask={(task) => setSelected({ id: task.id, date: task.date })}
          planningDate={viewMode === 'week' ? quickAddDate : null}
          onSelectPlanningDate={viewMode === 'week' ? handleSelectPlanningDate : undefined}
        />
        {selectedTask && <TaskSidebar task={selectedTask} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}

