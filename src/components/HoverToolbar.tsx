import type { ReactNode } from 'react'

export interface HoverToolbarAction {
  id: string
  /** Shown as the button's tooltip and used as its accessible name. */
  label: string
  icon: ReactNode
  /** `danger` tints the button red on hover, for destructive actions. */
  tone?: 'default' | 'danger'
  onClick: () => void
}

/**
 * Classes for the element the toolbar floats beneath. The toolbar reveals itself while this anchor
 * is hovered or contains keyboard focus, and since it's absolutely positioned it never shifts the
 * anchor's (or the page's) layout.
 */
export const HOVER_TOOLBAR_ANCHOR = 'group/hover-toolbar relative'

const TONE_CLASSES: Record<NonNullable<HoverToolbarAction['tone']>, string> = {
  default: 'hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100',
  danger: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400',
}

/**
 * Small floating row of icon buttons that fades/slides in just below its `HOVER_TOOLBAR_ANCHOR`
 * parent on hover or focus. The anchor-to-toolbar gap is padding on the toolbar itself, so moving
 * the pointer down onto the buttons never drops the hover.
 */
export function HoverToolbar({ actions }: { actions: HoverToolbarAction[] }) {
  if (actions.length === 0) return null

  return (
    <div
      role="toolbar"
      className="pointer-events-none absolute top-full left-1/2 z-10 -translate-x-1/2 -translate-y-1 scale-95 pt-1 opacity-0 transition duration-150 ease-out origin-top group-hover/hover-toolbar:pointer-events-auto group-hover/hover-toolbar:translate-y-0 group-hover/hover-toolbar:scale-100 group-hover/hover-toolbar:opacity-100 group-hover/hover-toolbar:delay-100 group-focus-within/hover-toolbar:pointer-events-auto group-focus-within/hover-toolbar:translate-y-0 group-focus-within/hover-toolbar:scale-100 group-focus-within/hover-toolbar:opacity-100"
    >
      <div className="flex gap-0.5 rounded-lg border border-neutral-200 bg-white p-0.5 shadow-md dark:border-neutral-700 dark:bg-neutral-900">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            title={action.label}
            className={`grid size-7 place-items-center rounded-md text-neutral-500 transition dark:text-neutral-400 ${TONE_CLASSES[action.tone ?? 'default']}`}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
