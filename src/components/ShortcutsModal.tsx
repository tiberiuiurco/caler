import { useEffect } from 'react'

interface ShortcutsModalProps {
  onClose: () => void
}

const SHORTCUTS: Array<{ keys: string; description: string }> = [
  { keys: 'q / e', description: 'Switch to week / day view' },
  { keys: '← → or a d', description: 'Page through weeks (week view) or days (day view)' },
  { keys: '↑ ↓ or w s', description: 'Move the task selection' },
  { keys: '.', description: 'Jump back to the current week or today' },
  { keys: 'j', description: 'Jump the day view to an arbitrary date' },
  { keys: ',', description: 'Open settings (import / export / erase data)' },
  { keys: 'i', description: 'Start quick-add planning' },
  { keys: 'x', description: 'Delete the selected task' },
  { keys: 't', description: 'Toggle light / dark theme' },
  { keys: 'Esc', description: 'Close a dialog or deselect the current task' },
]

/** Full-screen overlay listing all global keyboard shortcuts. Escape or the backdrop closes it. */
export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-96 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Keyboard shortcuts</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={keys} className="flex items-center justify-between gap-4">
              <dt className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {keys}
              </dt>
              <dd className="text-right text-neutral-500 dark:text-neutral-400">{description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
