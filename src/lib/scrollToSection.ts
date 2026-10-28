/**
 * Smooth-scroll to a homepage section by element id, accounting for the sticky
 * header so the section heading isn't hidden beneath it. `'top'` scrolls to the
 * very top of the document (the hero). Honors prefers-reduced-motion with an
 * instant jump. Safe to call when the target isn't present (no-op).
 */

// Sticky header is h-28 (112px); add a little breathing room above the heading.
const HEADER_OFFSET = 128

export function scrollToSection(id: string): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth'

  if (id === 'top') {
    window.scrollTo({ top: 0, left: 0, behavior })
    return
  }

  const el = document.getElementById(id)
  if (!el) return

  const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top: Math.max(0, y), left: 0, behavior })
}
