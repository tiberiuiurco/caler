import { useEffect, useRef, useState } from 'react'
import { formatHour } from '../lib/date'
import { parseEntry } from '../lib/parseEntry'

interface QuickAddBarProps {
  cursor: number
  rangeEnd: number
  onSubmit: (duration: number, title: string) => void
  onDismiss: () => void
}

/**
 * Small always-visible input that sequentially fills the remainder of the day.
 * Stays focused after every submission so the user never has to reach for the mouse.
 */
export function QuickAddBar({ cursor, rangeEnd, onSubmit, onDismiss }: QuickAddBarProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [cursor])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = parseEntry(value)
    if (!parsed) {
      setError('Use the form "DURATION TEXT", e.g. 1.5 Write report')
      return
    }
    onSubmit(parsed.duration, parsed.title)
    setValue('')
    setError(null)
  }

  return (
    <form
      onSubmit={handleSubmit}
      onBlur={(event) => {
        // Dismiss only when focus truly leaves the bar (not when it moves between its own children).
        if (!event.currentTarget.contains(event.relatedTarget)) onDismiss()
      }}
      className="mx-5 mt-3 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <span className="shrink-0 font-mono text-xs text-neutral-400">{formatHour(cursor)}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          setError(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onDismiss()
        }}
        placeholder={`Duration + task, e.g. "1 Deep work" — filling up to ${formatHour(rangeEnd)}`}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
      />
      {error && <span className="shrink-0 text-xs text-red-500">{error}</span>}
      <button
        type="submit"
        className="shrink-0 rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
      >
        Add
      </button>
    </form>
  )
}
