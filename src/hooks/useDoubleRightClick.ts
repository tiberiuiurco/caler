import { useRef } from 'react'

const DOUBLE_CLICK_WINDOW_MS = 400

/**
 * Returns an `onContextMenu` handler that invokes `onDoubleRightClick` when two
 * right-clicks land within `DOUBLE_CLICK_WINDOW_MS` of each other, and always
 * suppresses the native browser context menu.
 */
export function useDoubleRightClick(onDoubleRightClick: () => void) {
  const lastClickRef = useRef(0)

  return (event: React.MouseEvent) => {
    event.preventDefault()
    const now = performance.now()
    if (now - lastClickRef.current < DOUBLE_CLICK_WINDOW_MS) {
      lastClickRef.current = 0
      onDoubleRightClick()
    } else {
      lastClickRef.current = now
    }
  }
}
