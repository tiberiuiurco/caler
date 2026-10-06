import { useEffect, useRef, useState } from 'react'
import { renderMarkdown, toggleMarkdownCheckbox } from '../lib/markdown'
import type { DateKey } from '../types'

interface DailyNotesProps {
  date: DateKey
  /** Short label for the day the notes belong to, e.g. "Today" or "Tuesday, Oct 6". */
  dateLabel: string
  /** That day's saved markdown notes (empty string when none). */
  notes: string
  onSaveNotes: (markdown: string) => void
}

/**
 * Compact markdown notes for a single day, tucked under the weekly goals in day view. Collapses to
 * a single "+ Add note" line when empty; otherwise shows the rendered notes in a short scrollable
 * box. Cmd/Ctrl+Enter saves while editing, Escape cancels.
 */
export function DailyNotes({ date, dateLabel, notes, onSaveNotes }: DailyNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(notes)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Same as the weekly goals: switching days drops an unsaved edit instead of moving it along.
  useEffect(() => {
    setIsEditing(false)
  }, [date])

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus()
  }, [isEditing])

  function startEditing() {
    setDraft(notes)
    setIsEditing(true)
  }

  function handleSave() {
    onSaveNotes(draft)
    setIsEditing(false)
  }

  function handleContentClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.tagName !== 'INPUT' || (target as HTMLInputElement).type !== 'checkbox') return
    const indexAttr = target.getAttribute('data-task-index')
    if (indexAttr === null) return
    onSaveNotes(toggleMarkdownCheckbox(notes, Number(indexAttr)))
  }

  const hasNotes = notes.trim() !== ''

  if (!isEditing && !hasNotes) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className="shrink-0 rounded-lg border border-dashed border-neutral-200 px-3 py-1.5 text-left text-xs text-neutral-400 transition hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
      >
        + Add note for {dateLabel}
      </button>
    )
  }

  return (
    <section className="flex shrink-0 flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Notes <span className="font-normal text-neutral-400 dark:text-neutral-500">· {dateLabel}</span>
        </h3>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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
            rows={4}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setIsEditing(false)
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                handleSave()
              }
            }}
            placeholder="Anything worth remembering about this day… (Markdown)"
            className="max-h-48 resize-y rounded-lg border border-neutral-200 bg-transparent p-2 font-mono text-xs outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-md border border-neutral-200 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-md bg-neutral-900 py-1 text-xs font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Save
            </button>
          </div>
        </>
      ) : (
        <div
          className="markdown-content max-h-40 overflow-y-auto text-xs text-neutral-700 dark:text-neutral-300"
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) }}
        />
      )}
    </section>
  )
}
