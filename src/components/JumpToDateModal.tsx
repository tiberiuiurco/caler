import { useEffect, useRef, useState } from 'react'
import type { DateKey } from '../types'

interface JumpToDateModalProps {
  /** Resolves a parsed month/day into a concrete date, or null if that day doesn't exist. */
  resolveDate: (month: number, day: number) => DateKey | null
  onConfirm: (date: DateKey) => void
  onCancel: () => void
}

const DATE_PATTERN = /^\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*$/

/** Small centered prompt for "j": jump the day view to an arbitrary MM/DD date. Escape cancels. */
export function JumpToDateModal({ resolveDate, onConfirm, onCancel }: JumpToDateModalProps) {
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
    const match = DATE_PATTERN.exec(value)
    if (!match) {
      setError('Use the form "MM/DD", e.g. 07/25')
      return
    }
    const month = Number.parseInt(match[1], 10)
    const day = Number.parseInt(match[2], 10)
    if (month < 1 || month > 12) {
      setError('Month must be between 1 and 12')
      return
    }
    const date = resolveDate(month, day)
    if (!date) {
      setError('That day does not exist in that month')
      return
    }
    onConfirm(date)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-80 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Jump to a date</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Which date? (e.g. <span className="font-mono">07/25</span>)
        </p>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          placeholder="MM/DD"
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
            Go
          </button>
        </div>
      </form>
    </div>
  )
}
