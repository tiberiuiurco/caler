import { useEffect } from 'react'
import { usePlannerStore } from '../store/plannerStore'

/** Keeps the `dark`/`light` class on <html> in sync with the store so Tailwind's `dark:` variants apply. */
export function useTheme() {
  const theme = usePlannerStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }, [theme])

  return theme
}
