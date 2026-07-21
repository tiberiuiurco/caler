import { usePlannerStore } from '../store/plannerStore'

export function ThemeToggle() {
  const theme = usePlannerStore((state) => state.theme)
  const toggleTheme = usePlannerStore((state) => state.toggleTheme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme (T)"
      className="grid size-9 place-items-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4.5">
          <circle cx="12" cy="12" r="4.2" />
          <path
            strokeLinecap="round"
            d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.55 1.55M18.25 18.25l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.55-1.55M18.25 5.75l1.55-1.55"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-4.5">
          <path d="M20.4 14.7A8.5 8.5 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z" />
        </svg>
      )}
    </button>
  )
}
