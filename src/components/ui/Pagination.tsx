import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '../../i18n/useLanguage'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
  className?: string
}

/**
 * Minimal, accessible pager. Arrows are logical (ChevronLeft reads as
 * "previous" in both directions because the control sits in the flow and the
 * labels carry the meaning). Hidden entirely when there is a single page.
 */
export default function Pagination({
  page,
  pageCount,
  onChange,
  className = '',
}: PaginationProps) {
  const t = useT()
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label={t.common.page(page, pageCount)}
      className={`flex items-center justify-between gap-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t.common.prevPage}
        className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        <span className="hidden sm:inline">{t.common.prevPage}</span>
      </button>

      <span className="text-sm text-muted">
        <bdi>{t.common.page(page, pageCount)}</bdi>
      </span>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t.common.nextPage}
        className="inline-flex items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-2 text-sm font-medium text-content transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline">{t.common.nextPage}</span>
        <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
      </button>
    </nav>
  )
}
