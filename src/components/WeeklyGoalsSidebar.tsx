import { useEffect, useRef, useState } from 'react'
import { renderMarkdown, toggleMarkdownCheckbox } from '../lib/markdown'
import type { DateKey } from '../types'

interface WeeklyGoalsSidebarProps {
  /** Monday date key of the week currently being shown (see `weekStartKey`). */
  weekStart: DateKey
  /** Fixed-width range label for that week, e.g. "Jul 21 – Jul 27". */
  weekLabel: string
  /** This week's saved markdown goals (empty string when none have been set yet). */
  goals: string
  onSaveGoals: (markdown: string) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
      <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

/**
 * Collapsible right-hand panel for a week's markdown goals — expanded by default, shrinkable to a
 * thin strip like a browser's vertical tab bar. Shows the markdown rendered by default with an
 * "Edit" button when non-empty; editing swaps in a textarea with "Cancel"/"Save".
 */
export function WeeklyGoalsSidebar({ weekStart, weekLabel, goals, onSaveGoals, expanded, onExpandedChange }: WeeklyGoalsSidebarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(goals)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Switching to a different week always drops any in-progress, unsaved edit for the previous
  // week rather than risk carrying its draft text over (or silently saving it under the new week).
  useEffect(() => {
    setIsEditing(false)
  }, [weekStart])

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus()
  }, [isEditing])

  function startEditing() {
    setDraft(goals)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  function handleSave() {
    onSaveGoals(draft)
    setIsEditing(false)
  }

  // Clicking a rendered task-list checkbox toggles it straight in the saved markdown, no need to
  // go through Edit/Save — this only listens for checkbox clicks, everything else in the rendered
  // markdown (links, text, ...) is unaffected.
  function handleContentClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.tagName !== 'INPUT' || (target as HTMLInputElement).type !== 'checkbox') return
    const indexAttr = target.getAttribute('data-task-index')
    if (indexAttr === null) return
    onSaveGoals(toggleMarkdownCheckbox(goals, Number(indexAttr)))
  }

  if (!expanded) {
    return (
      <div className="flex w-10 shrink-0 flex-col items-center border-l border-neutral-200 bg-white py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => onExpandedChange(true)}
          aria-label="Expand weekly goals"
          title="Expand weekly goals"
          className="grid size-7 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <ChevronIcon direction="left" />
        </button>
        <span
          className="mt-3 text-[11px] font-medium tracking-wide text-neutral-400 dark:text-neutral-500"
          style={{ writingMode: 'vertical-rl' }}
        >
          Weekly goals
        </span>
      </div>
    )
  }

  const hasGoals = goals.trim() !== ''

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-3 border-l border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onExpandedChange(false)}
          aria-label="Collapse weekly goals"
          title="Collapse weekly goals"
          className="grid size-7 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <ChevronIcon direction="right" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Weekly goals</h2>
          <p className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">{weekLabel}</p>
        </div>
        {!isEditing && hasGoals && (
          <button
            type="button"
            onClick={startEditing}
            className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write this week's goals in Markdown…"
            className="min-h-0 flex-1 resize-none rounded-lg border border-neutral-200 bg-transparent p-3 font-mono text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Save
            </button>
          </div>
        </>
      ) : hasGoals ? (
        <div
          className="markdown-content min-h-0 flex-1 overflow-y-auto text-sm text-neutral-800 dark:text-neutral-200"
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(goals) }}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutral-400 dark:text-neutral-500">No goals set for this week yet.</p>
          <button
            type="button"
            onClick={startEditing}
            className="rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-500 transition hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            + Add goals
          </button>
        </div>
      )}
    </aside>
  )
}
