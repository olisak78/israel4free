import { useEffect, useMemo, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import DomainCard from '../components/DomainCard'
import OrganizationCard from '../components/OrganizationCard'
import GlobalSearch from '../components/GlobalSearch'
import Footer from '../components/Footer'
import { scrollToSection } from '../lib/scrollToSection'
import {
  categories,
  categoryLabel,
  datasets,
  datasetsForTopic,
  organizations,
  popularDatasets,
  type CategoryId,
  type Filter,
} from '../data/datasets'
import { useLanguage, useT } from '../i18n/useLanguage'

const CATEGORY_IDS: CategoryId[] = ['transport', 'locations', 'infrastructure']

/** Organizations shown before the "View all" reveal — keeps the grid scannable
 *  when the catalog grows. With few organizations, all are shown and no toggle
 *  appears. */
const INITIAL_ORG_COUNT = 8

export default function Home() {
  const t = useT()
  const { language } = useLanguage()

  const popular = useMemo(() => popularDatasets(), [])

  // When arriving from a header nav item (either on another route, via router
  // state, or a direct `/#organizations` hash link), scroll to the requested
  // section once the page has laid out. Runs per navigation (location.key).
  const location = useLocation()
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    const target =
      state?.scrollTo ?? (location.hash ? location.hash.slice(1) : '')
    if (!target || target === 'top') return
    // rAF lets layout settle (and runs after ScrollToTop's instant jump).
    const id = requestAnimationFrame(() => scrollToSection(target))
    return () => cancelAnimationFrame(id)
  }, [location.key, location.hash, location.state])

  // The topic filter lives in the URL (`/?c=transport`), so it is shareable,
  // survives refresh, and participates in browser back/forward navigation. The
  // header's category links write the same param.
  const [searchParams, setSearchParams] = useSearchParams()
  const rawFilter = searchParams.get('c')
  const filter: Filter =
    rawFilter && (CATEGORY_IDS as string[]).includes(rawFilter)
      ? (rawFilter as CategoryId)
      : 'all'

  function onFilterChange(next: Filter) {
    if (next === 'all') {
      setSearchParams({}, { replace: false })
    } else {
      setSearchParams({ c: next }, { replace: false })
    }
  }

  const visible = useMemo(
    () => (filter === 'all' ? datasets : datasetsForTopic(filter)),
    [filter],
  )

  const filters: { id: Filter; label: string }[] = [
    { id: 'all', label: t.datasets.all },
    ...categories.map((c) => ({
      id: c.id,
      label: categoryLabel(c.id, language),
    })),
  ]

  const [showAllOrgs, setShowAllOrgs] = useState(false)
  const visibleOrgs = showAllOrgs
    ? organizations
    : organizations.slice(0, INITIAL_ORG_COUNT)

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
      {/* ── Hero — compact, centered, with the primary global search ───────── */}
      <section className="mb-12 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand">
          {t.hero.eyebrow}
        </p>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-content sm:text-[2.5rem] sm:leading-[1.1]">
          {t.hero.titleLead}{' '}
          <span className="text-brand">{t.hero.titleAccent}</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted">
          {t.hero.subtitle}
        </p>

        {/* Primary action: search across the whole catalog */}
        <GlobalSearch />

        {/* Honest, derived metrics strip (no live/operational claims).
            Numbers are isolated with <bdi> so they never reorder in RTL. */}
        <dl className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{t.stats.datasets}</dt>
            <dd className="font-semibold text-content">
              <bdi>{datasets.length}</bdi>
            </dd>
            <span className="text-muted">{t.stats.datasets}</span>
          </div>
          <span className="hidden h-4 w-px bg-edge sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{t.home.orgsHeading}</dt>
            <dd className="font-semibold text-content">
              <bdi>{organizations.length}</bdi>
            </dd>
            <span className="text-muted">{t.org.breadcrumbOrgs}</span>
          </div>
          <span className="hidden h-4 w-px bg-edge sm:block" aria-hidden="true" />
          <div className="flex items-baseline gap-1.5">
            <dd className="font-medium text-content">{t.stats.access}</dd>
          </div>
        </dl>
      </section>

      {/* ── Popular datasets — direct access to the most-used tools ────────── */}
      <section id="popular" aria-labelledby="popular-heading" className="mb-12">
        <div className="mb-4">
          <h2 id="popular-heading" className="text-lg font-semibold text-content">
            {t.home.popularHeading}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t.home.popularSub}</p>
        </div>

        <div
          dir="ltr"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {popular.map((d) => (
            <DomainCard key={d.id} {...d} />
          ))}
        </div>
      </section>

      {/* ── Browse by government organization — the primary structure ──────── */}
      <section id="organizations" aria-labelledby="orgs-heading" className="mb-12">
        <div className="mb-4">
          <h2 id="orgs-heading" className="text-lg font-semibold text-content">
            {t.home.orgsHeading}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t.home.orgsSub}</p>
        </div>

        <div
          dir="ltr"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visibleOrgs.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>

        {organizations.length > INITIAL_ORG_COUNT && !showAllOrgs && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowAllOrgs(true)}
              className="rounded-full border border-edge bg-surface px-4 py-1.5 text-sm font-medium text-muted transition-colors hover:border-faint hover:text-content"
            >
              {t.home.viewAllOrgs}
            </button>
          </div>
        )}
      </section>

      {/* ── Browse by topic — secondary discovery, no org knowledge needed ─── */}
      <section id="topics" aria-labelledby="topics-heading">
        <div className="mb-4">
          <h2 id="topics-heading" className="text-lg font-semibold text-content">
            {t.home.topicsHeading}
          </h2>
          <p className="mt-0.5 text-sm text-muted">{t.home.topicsSub}</p>
        </div>

        {/* Topic chips — centered logically, kept in sync with header nav */}
        <div
          role="group"
          aria-label={t.datasets.filterLabel}
          className="mb-4 flex flex-wrap gap-2"
        >
          {filters.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => onFilterChange(f.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition duration-150 motion-reduce:transition-none ${
                  active
                    ? 'border-brand bg-brand text-brand-fg'
                    : 'border-edge bg-surface text-muted hover:border-faint hover:text-content'
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <p className="mb-4 text-sm text-muted" aria-live="polite">
          {t.datasets.shown(visible.length, datasets.length)}
        </p>

        {visible.length > 0 ? (
          // dir="ltr" keeps the card grid in a fixed physical order across
          // languages; each card renders its own text in the correct direction.
          <div
            dir="ltr"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {visible.map((d) => (
              <DomainCard key={d.id} {...d} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-card border border-dashed border-edge bg-surface py-16 text-center">
            <SearchX className="h-8 w-8 text-faint" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-content">
              {t.datasets.emptyTitle}
            </p>
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className="mt-2 text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t.datasets.emptyCta}
            </button>
          </div>
        )}
      </section>

      {/* Footer — centered */}
      <Footer />
    </div>
  )
}
