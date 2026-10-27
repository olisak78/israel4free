import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import DomainCard from '../components/DomainCard'
import SearchInput from '../components/ui/SearchInput'
import EmptyState from '../components/ui/EmptyState'
import {
  datasetsForOrganization,
  getOrganizationBySlug,
} from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

/**
 * Reusable, data-driven organization page. One template serves every
 * organization — content is resolved from the catalog by the `:slug` route
 * param, so adding an organization needs no new page component. Works equally
 * for an organization with two datasets or dozens.
 */
export default function Organization() {
  const t = useT()
  const { language, dir } = useLanguage()
  const { organizationSlug } = useParams<{ organizationSlug: string }>()

  const organization = organizationSlug
    ? getOrganizationBySlug(organizationSlug)
    : undefined

  const [query, setQuery] = useState('')

  // All datasets this organization publishes (derived from the catalog), then
  // filtered by the in-page search over the active language's fields.
  const orgDatasets = useMemo(
    () => (organization ? datasetsForOrganization(organization.id) : []),
    [organization],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orgDatasets
    return orgDatasets.filter((d) =>
      [d.title, d.titleHe, d.description, d.descriptionHe, ...(d.keywords ?? []), ...(d.keywordsHe ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [orgDatasets, query])

  // Unknown slug → a useful not-found state (keeps direct navigation honest).
  if (!organization) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <EmptyState
          title={t.org.notFoundTitle}
          body={t.org.notFoundBody}
          action={
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              {t.org.notFoundCta}
            </Link>
          }
        />
      </div>
    )
  }

  const isHe = language === 'he'
  const name = isHe ? organization.nameHe : organization.name
  const description = isHe
    ? organization.descriptionHe
    : organization.description
  const Icon = organization.icon
  const count = orgDatasets.length

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
          <li aria-current="page" className="truncate font-medium text-content">
            {name}
          </li>
        </ol>
      </nav>

      {/* Title block */}
      <div className="mb-6 flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-card ${organization.accentBg}`}
        >
          <Icon
            className={`h-6 w-6 ${organization.accentText}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {name}
          </h1>
          <p className="mt-1 text-sm font-medium text-brand">
            {t.org.datasetCount(count)}
          </p>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* In-organization search — shown once there's more than one dataset */}
      {orgDatasets.length > 1 && (
        <div dir={dir} className="mb-5 max-w-md">
          <SearchInput
            id="org-dataset-search"
            label={t.org.searchLabel}
            hideLabel
            value={query}
            onChange={setQuery}
            placeholder={t.org.searchPlaceholder}
          />
        </div>
      )}

      {/* Datasets — each links to its dedicated landing page */}
      {filtered.length > 0 ? (
        <div
          dir="ltr"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((d) => (
            <DomainCard key={d.id} {...d} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.org.emptyTitle}
          body={t.org.emptyBody}
          action={
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t.org.emptyCta}
            </button>
          }
        />
      )}
    </div>
  )
}
