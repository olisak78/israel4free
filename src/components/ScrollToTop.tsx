import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Resets the window scroll position to the top whenever the pathname changes.
 * Preserves in-page navigation (hash links) and honors reduced-motion by using
 * an instant jump. Renders nothing.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}
