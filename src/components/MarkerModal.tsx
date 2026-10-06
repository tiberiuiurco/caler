import { useEffect, useRef, useState } from 'react'
import { parseMarkerEntry } from '../lib/parseTime'

interface MarkerModalProps {
  /** Shown when the marker is going onto a day other than today. */
  dateLabel?: string
  onConfirm: (hour: number, label: string) => void
  /** Reports the marker as currently typed (null while unparseable), so the calendar can preview it. */
  onPreviewChange: (preview: { hour: number; label: string } | null) => void
  onCancel: () => void
}

/**
 * Small prompt for "l": drops a labelled marker line onto the planning day. Escape cancels.
 * Floats over the left half without dimming anything, so the target day (on the right in day view)
 * stays fully visible along with a live preview of the line.
 */
export function MarkerModal({ dateLabel, onConfirm, onPreviewChange, onCancel }: MarkerModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const parsed = parseMarkerEntry(value)
    if (!parsed) {
      setError('Use "TIME [LABEL]", e.g. 7:30 Lunch (time as 07:30, 7:30, 7 or 7.5)')
      return
    }
    onConfirm(parsed.hour, parsed.label)
  }

  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-50 grid w-1/2 place-items-center">
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto w-80 rounded-2xl border border-violet-300 bg-white/95 p-6 shadow-2xl ring-4 ring-violet-500/10 backdrop-blur dark:border-violet-800 dark:bg-neutral-900/95"
      >
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Add a marker{dateLabel ? ` for ${dateLabel}` : ''}
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Time and optional name (e.g. <span className="font-mono">7:30 Lunch</span>)
        </p>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
            onPreviewChange(parseMarkerEntry(event.target.value))
          }}
          placeholder="TIME [LABEL]"
          className="mt-4 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-neutral-200 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
