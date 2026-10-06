import type { PlannerState } from '../store/plannerStore'

/** Serializes the planner data (ranges + tasks + markers + weekly goals + daily notes) and triggers a JSON file download. */
export function exportPlannerData(state: Pick<PlannerState, 'ranges' | 'tasks' | 'markers' | 'weeklyGoals' | 'dailyNotes'>) {
  const payload = {
    exportedAt: new Date().toISOString(),
    ranges: state.ranges,
    tasks: state.tasks,
    markers: state.markers,
    weeklyGoals: state.weeklyGoals,
    dailyNotes: state.dailyNotes,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `caler-export-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
