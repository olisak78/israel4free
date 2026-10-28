import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, FlaskConical } from 'lucide-react'
import { datasets } from '../../data/datasets'
import { useLanguage, useT } from '../../i18n/useLanguage'

interface PageShellProps {
  /** Dataset id — supplies the icon, accent colors, and page title/description. */
  datasetId: string
  title: string
  description: string
  /** Optional slot rendered on the heading's trailing edge (e.g. a view toggle). */
  headerActions?: ReactNode
  /**
   * Provenance banner. Omit for the default "sample data" notice; pass a node
   * to replace it (e.g. a real-data source banner); pass `null` to hide it.
   */
  provenance?: ReactNode
  children: ReactNode
}

/**
 * Consistent dataset-page frame: breadcrumbs, a title block with the dataset's
 * icon, a sample-data provenance banner, and a content area. Each page supplies
 * its own body layout, so pages share chrome without looking identical.
 */
export default function PageShell({
  datasetId,
  title,
  description,
  headerActions,
  provenance,
  children,
}: PageShellProps) {
  const t = useT()
  const { dir } = useLanguage()
  const dataset = datasets.find((d) => d.id === datasetId)
  const Icon = dataset?.icon

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Breadcrumbs — semantic, direction-aware (chevron mirrors in RTL) */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-muted">
          <li>
            <Link
              to="/"
              className="rounded font-medium text-muted hover:text-content"
            >
              {t.common.breadcrumbHome}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4 text-faint rtl:-scale-x-100" />
          </li>
          <li aria-current="page" className="font-medium text-content">
            {title}
          </li>
        </ol>
      </nav>

      {/* Title block */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-card ${dataset?.accentBg ?? ''}`}
            >
              <Icon
                className={`h-6 w-6 ${dataset?.accentText ?? 'text-brand'}`}
                strokeWidth={2}
                aria-hidden="true"
              />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          </div>
        </div>
        {headerActions && (
          <div dir={dir} className="shrink-0">
            {headerActions}
          </div>
        )}
      </div>

      {/* Provenance — the default keeps sample-data pages honest; pages with a
          real source (or none) override via the `provenance` prop. */}
      {provenance === undefined ? (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs text-muted">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
          <p>{t.common.mockNotice}</p>
        </div>
      ) : (
        provenance
      )}

      {children}
    </div>
  )
}
