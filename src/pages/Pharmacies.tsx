import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Database,
  Info,
  Loader2,
  MapPin,
  Navigation,
  Pill,
  RefreshCw,
  Truck,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import type { Pharmacy } from '../data/types'
import {
  initPharmacies,
  retryPharmacies,
  usePharmacyData,
} from '../data/services/pharmacyStore'
import { useLanguage, useT } from '../i18n/useLanguage'

const PAGE_SIZE = 9

type DeliveryFilter = 'all' | 'yes' | 'no'
type SortKey = 'name' | 'city' | 'delivery'

function formatDate(epoch: number, language: string): string {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epoch))
}

/** Scope notice — always visible so users understand the dataset before browsing. */
function ScopeNotice() {
  const t = useT()
  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-2.5 rounded-card border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand-soft-fg"
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
      <p className="leading-relaxed">{t.pharmacies.notice}</p>
    </div>
  )
}

export default function Pharmacies() {
  const t = useT()
  const { language } = useLanguage()
  const tp = t.pharmacies

  const { status, pharmacies, total, error, isStale, isRefreshing, lastUpdated } =
    usePharmacyData()

  // Load from the 72-hour cache / API once on mount.
  useEffect(() => {
    initPharmacies()
  }, [])

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [delivery, setDelivery] = useState<DeliveryFilter>('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [page, setPage] = useState(1)

  // City options derived from the real dataset (never hardcoded).
  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const p of pharmacies) if (p.city) set.add(p.city)
    return [...set].sort((a, b) => a.localeCompare(b, 'he'))
  }, [pharmacies])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = pharmacies.filter((p) => {
      if (city && p.city !== city) return false
      // Only classify into a delivery bucket when the value is reliably known.
      if (delivery === 'yes' && p.delivery !== true) return false
      if (delivery === 'no' && p.delivery !== false) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.street.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q)
      )
    })

    const byName = (a: Pharmacy, b: Pharmacy) =>
      a.name.localeCompare(b.name, 'he')
    rows.sort((a, b) => {
      if (sort === 'city') {
        return a.city.localeCompare(b.city, 'he') || byName(a, b)
      }
      if (sort === 'delivery') {
        // Available first, then unknown, then explicitly unavailable.
        const rank = (d: boolean | null) => (d === true ? 0 : d === null ? 1 : 2)
        return rank(a.delivery) - rank(b.delivery) || byName(a, b)
      }
      return byName(a, b)
    })
    return rows
  }, [pharmacies, search, city, delivery, sort])

  // Return to the first page whenever the filters/sort change.
  useEffect(() => setPage(1), [search, city, delivery, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function resetFilters() {
    setSearch('')
    setCity('')
    setDelivery('all')
  }

  const hasActiveFilters = Boolean(search || city || delivery !== 'all')

  // ── Provenance banner: real source + fetch freshness, or a stale fallback ──
  let provenance: React.ReactNode = null
  if (status === 'success' && isStale) {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="font-medium">{tp.staleTitle}</span>
        <span className="text-muted">
          {tp.staleBody(formatDate(lastUpdated ?? Date.now(), language))}
        </span>
        <button
          type="button"
          onClick={retryPharmacies}
          className="ms-auto inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {tp.retry}
        </button>
      </div>
    )
  } else if (status === 'success') {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs text-muted">
        <Database className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span>
          {tp.source}:{' '}
          <bdi className="font-medium text-content">{tp.sourceName}</bdi>
        </span>
        {lastUpdated !== null && (
          <>
            <span className="text-faint" aria-hidden="true">
              ·
            </span>
            <span>{tp.updatedOn(formatDate(lastUpdated, language))}</span>
          </>
        )}
        {isRefreshing && (
          <span className="ms-auto inline-flex items-center gap-1 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {tp.refreshing}
          </span>
        )}
      </div>
    )
  }

  // ── Loading (no cached data yet): skeletons, no misleading numbers ─────────
  if (status === 'loading' || status === 'idle') {
    return (
      <PageShell datasetId="pharmacies" title={tp.title} description={tp.description} provenance={null}>
        <ScopeNotice />
        <div className="flex items-center gap-2 rounded-card border border-edge bg-surface p-4 text-sm text-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
          <span>{tp.loadingBody}</span>
        </div>
        <div
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-card border border-edge bg-surface-2"
            />
          ))}
        </div>
      </PageShell>
    )
  }

  // ── Hard error with no data to fall back on ────────────────────────────────
  if (status === 'error') {
    return (
      <PageShell datasetId="pharmacies" title={tp.title} description={tp.description} provenance={null}>
        <ScopeNotice />
        <EmptyState
          icon={AlertTriangle}
          title={tp.errorTitle}
          body={tp.errors[error ?? 'unknown']}
          action={
            <button
              type="button"
              onClick={retryPharmacies}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {tp.retry}
            </button>
          }
        />
      </PageShell>
    )
  }

  // ── Success (fresh or stale fallback) ──────────────────────────────────────
  return (
    <PageShell
      datasetId="pharmacies"
      title={tp.title}
      description={tp.description}
      provenance={provenance}
    >
      <ScopeNotice />

      {/* Filter bar */}
      <div className="rounded-card border border-edge bg-surface p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:items-end">
          <SearchInput
            id="ph-search"
            label={tp.searchLabel}
            value={search}
            onChange={setSearch}
            placeholder={tp.searchPlaceholder}
          />
          <Select
            id="ph-city"
            label={tp.cityFilter}
            value={city}
            onChange={setCity}
            options={[
              { value: '', label: tp.allCities },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            id="ph-delivery"
            label={tp.deliveryFilter}
            value={delivery}
            onChange={(v) => setDelivery(v as DeliveryFilter)}
            options={[
              { value: 'all', label: tp.delivery.all },
              { value: 'yes', label: tp.delivery.yes },
              { value: 'no', label: tp.delivery.no },
            ]}
          />
          <Select
            id="ph-sort"
            label={tp.sortLabel}
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'name', label: tp.sort.name },
              { value: 'city', label: tp.sort.city },
              { value: 'delivery', label: tp.sort.delivery },
            ]}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {t.common.showing(filtered.length, total)}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t.common.resetFilters}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Pill}
          title={t.common.noResultsTitle}
          body={t.common.noResultsBody}
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                {t.common.resetFilters}
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((p) => (
              <li key={p.id}>
                <PharmacyCard pharmacy={p} />
              </li>
            ))}
          </ul>
          <Pagination className="mt-6" page={current} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </PageShell>
  )
}

/** Longer notes collapse to a few lines with an accessible toggle to reveal all. */
const NOTES_CLAMP = 90

function PharmacyCard({ pharmacy: p }: { pharmacy: Pharmacy }) {
  const t = useT()
  const tp = t.pharmacies
  const [notesOpen, setNotesOpen] = useState(false)

  const name = p.name || tp.unnamed
  const address = [p.street, p.city].filter(Boolean).join(', ')
  const longNotes = p.notes.length > NOTES_CLAMP

  return (
    <div className="flex h-full flex-col rounded-card border border-edge bg-surface p-4 shadow-card">
      {/* Primary */}
      <div className="flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/15">
          <Pill className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-content">{name}</h3>
          {p.delivery !== null && (
            <div className="mt-1.5">
              <StatusBadge
                tone={p.delivery ? 'success' : 'neutral'}
                dot={false}
                label={
                  <span className="inline-flex items-center gap-1">
                    <Truck className="h-3 w-3" aria-hidden="true" />
                    {p.delivery ? tp.deliveryAvailable : tp.deliveryUnavailable}
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <p className="mt-3 flex items-start gap-1.5 text-sm text-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        {address ? (
          <bdi className="text-content">{address}</bdi>
        ) : (
          <span className="italic">{tp.addressUnavailable}</span>
        )}
      </p>

      {/* Notes */}
      {p.notes && (
        <div className="mt-2 text-sm text-muted">
          <p className={!notesOpen && longNotes ? 'line-clamp-2' : ''}>
            <span className="font-medium text-content">{tp.notesLabel}:</span> {p.notes}
          </p>
          {longNotes && (
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              aria-expanded={notesOpen}
              className="mt-0.5 text-xs font-medium text-brand hover:text-brand-hover"
            >
              {notesOpen ? tp.showLess : tp.showMore}
            </button>
          )}
        </div>
      )}

      {/* Action */}
      {p.directionsUrl && (
        <div className="mt-auto flex items-center border-t border-edge pt-3">
          <a
            href={p.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tp.directionsAria(name)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            {tp.getDirections}
          </a>
        </div>
      )}
    </div>
  )
}
