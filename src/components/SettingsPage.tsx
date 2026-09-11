import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { parsePlannerExport, type ParseCounts, type ParsedPlannerData } from '../lib/importData'

interface SettingsPageProps {
  onClose: () => void
  onExport: () => void
  onImport: (data: ParsedPlannerData, mode: 'replace' | 'merge') => void
  onEraseAll: () => void
}

type PendingImport = { data: ParsedPlannerData; counts: ParseCounts; mode: 'replace' | 'merge' }

/** Full-screen settings overlay: export, import (replace/merge), and erase-all, each destructive step confirmed. */
export function SettingsPage({ onClose, onExport, onImport, onEraseAll }: SettingsPageProps) {
  const [mode, setMode] = useState<'replace' | 'merge'>('replace')
  const [importError, setImportError] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [eraseOpen, setEraseOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (pendingImport) return setPendingImport(null)
      if (eraseOpen) return setEraseOpen(false)
      onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, pendingImport, eraseOpen])

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const text = await file.text()
    const result = parsePlannerExport(text)
    if (!result.ok) {
      setImportError(result.error)
      return
    }
    setImportError(null)
    setPendingImport({ data: result.data, counts: result.counts, mode })
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-xl px-6 py-8">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-neutral-500 transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ← Settings
        </button>

        <section className="mt-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Data</h2>

          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Export all data</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Download every task, day range, and weekly goal as JSON.</p>
            </div>
            <button
              type="button"
              onClick={onExport}
              className="shrink-0 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Export
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Import from file</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Restore a previous export, either replacing or merging with what you have now.</p>

            <div className="mt-3 flex gap-4 text-sm text-neutral-700 dark:text-neutral-300">
              <label className="flex items-center gap-1.5">
                <input type="radio" name="import-mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                Replace
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" name="import-mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
                Merge
              </label>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Choose file…
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />

            {importError && <p className="mt-2 text-xs text-red-500">{importError}</p>}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-semibold text-red-500">Danger zone</h2>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 p-4 dark:border-red-900/60">
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Erase all data</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Permanently delete every task, day range, and weekly goal.</p>
            </div>
            <button
              type="button"
              onClick={() => setEraseOpen(true)}
              className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-600"
            >
              Erase…
            </button>
          </div>
        </section>
      </div>

      {pendingImport && (
        <ConfirmDialog
          title={pendingImport.mode === 'merge' ? 'Merge imported data?' : 'Replace all data?'}
          message={
            pendingImport.mode === 'merge'
              ? `${pendingImport.counts.tasks} tasks and ${pendingImport.counts.goalWeeks} weeks of goals will be merged in. Entries with the same id or date will be overwritten.`
              : `Importing will permanently replace your data with ${pendingImport.counts.tasks} tasks across ${pendingImport.counts.days} days and ${pendingImport.counts.goalWeeks} weeks of goals.`
          }
          confirmLabel={pendingImport.mode === 'merge' ? 'Merge' : 'Replace'}
          onConfirm={() => {
            onImport(pendingImport.data, pendingImport.mode)
            setPendingImport(null)
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}

      {eraseOpen && (
        <ConfirmDialog
          title="Erase all data?"
          message="All tasks, day ranges, and weekly goals will be permanently deleted. This cannot be undone."
          confirmLabel="Erase"
          onConfirm={() => {
            onEraseAll()
            setEraseOpen(false)
          }}
          onCancel={() => setEraseOpen(false)}
        />
      )}
    </div>
  )
}
