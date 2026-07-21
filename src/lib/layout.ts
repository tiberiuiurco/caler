import type { Task } from '../types'

export interface TaskLayout {
  /** Left offset, as a percentage of the column's width. */
  left: number
  /** Width, as a percentage of the column's width. */
  width: number
}

function overlaps(a: Task, b: Task): boolean {
  return a.start < b.start + b.duration && b.start < a.start + a.duration
}

/**
 * Lays out a day's tasks so overlapping ones sit side by side instead of stacking on top of
 * each other. Tasks that transitively overlap (through a chain of pairwise overlaps) form a
 * single group; the group's width is split evenly across all of its members, ordered left to
 * right by duration (shortest first), breaking ties alphabetically by title.
 */
export function layoutTasks(tasks: Task[]): Map<string, TaskLayout> {
  const layout = new Map<string, TaskLayout>()
  const visited = new Set<string>()

  for (const task of tasks) {
    if (visited.has(task.id)) continue

    const group: Task[] = []
    const stack = [task]
    visited.add(task.id)
    while (stack.length > 0) {
      const current = stack.pop()!
      group.push(current)
      for (const other of tasks) {
        if (!visited.has(other.id) && overlaps(current, other)) {
          visited.add(other.id)
          stack.push(other)
        }
      }
    }

    const ordered = [...group].sort(
      (a, b) => a.duration - b.duration || a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
    )
    const width = 100 / ordered.length
    ordered.forEach((member, index) => {
      layout.set(member.id, { left: index * width, width })
    })
  }

  return layout
}
