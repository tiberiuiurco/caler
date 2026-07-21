import { useEffect, useRef, useState } from 'react'

interface RangeModalProps {
  onConfirm: (start: number, end: number) => void
}

const RANGE_PATTERN = /^\s*(\d{1,2}(?:\.\d+)?)\s*-\s*(\d{1,2}(?:\.\d+)?)\s*$/

export function RangeModal({ onConfirm }: RangeModalProps) {
  const [value, setValue] = useState('5-21')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Autofocus the instant the app opens so the user can start typing immediately.
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const match = RANGE_PATTERN.exec(value)
    if (!match) {
      setError('Use the form "START-END", e.g. 5-21')
      return
    }
    const start = Number.parseFloat(match[1])
    const end = Number.parseFloat(match[2])
    if (start < 0 || end > 24 || start >= end) {
      setError('Range must be within 0-24 and start before it ends')
      return
    }
    onConfirm(start, end)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/40 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-80 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Plan today</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          What hours are active today? (e.g. <span className="font-mono">5-21</span>)
        </p>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError(null)
          }}
          placeholder="5-21"
          className="mt-4 w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-neutral-400 dark:border-neutral-700 dark:focus:border-neutral-500"
        />
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Start planning
        </button>
      </form>
    </div>
  )
}
