import { useEffect, useMemo, useState } from 'react'
import {
  Accessibility,
  AlertTriangle,
  Banknote,
  Building2,
  ChevronDown,
  Database,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  RefreshCw,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/ui/EmptyState'
import AtmMap from '../components/ui/AtmMap'
import type { Atm } from '../data/types'
import { initAtms, retryAtms, useAtmData } from '../data/services/atmStore'
import { useLanguage, useT } from '../i18n/useLanguage'

type AccessFilter = 'all' | 'yes' | 'no' | 'unknown'

// Cap the rendered list for performance; the map still plots every match.
const LIST_LIMIT = 200

function formatDate(epoch: number, language: string): string {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(epoch))
}

export default function AtmLocations() {
  const t = useT()
  const { language, dir } = useLanguage()
  const ta = t.atms

  const { status, atms, error, isStale, isRefreshing, lastUpdated } =
    useAtmData()

  // Load from the daily cache / API once on mount.
  useEffect(() => {
    initAtms()
  }, [])

  const [search, setSearch] = useState('')
  const [bank, setBank] = useState('')
  const [city, setCity] = useState('')
  const [access, setAccess] = useState<AccessFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  // Filter options derived from the real dataset (never hardcoded).
  const banks = useMemo(() => {
    const set = new Set<string>()
    for (const a of atms) if (a.bankName) set.add(a.bankName)
    return [...set].sort((x, y) => x.localeCompare(y, 'he'))
  }, [atms])

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const a of atms) if (a.city) set.add(a.city)
    return [...set].sort((x, y) => x.localeCompare(y, 'he'))
  }, [atms])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return atms.filter((a) => {
      if (bank && a.bankName !== bank) return false
      if (city && a.city !== city) return false
      if (access === 'yes' && a.wheelchairAccessible !== true) return false
      if (access === 'no' && a.wheelchairAccessible !== false) return false
      if (access === 'unknown' && a.wheelchairAccessible !== null) return false
      if (!q) return true
      return (
        a.bankName.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        (a.atmNumber !== null && String(a.atmNumber).includes(q))
      )
    })
  }, [atms, search, bank, city, access])

  const visibleList = filtered.slice(0, LIST_LIMIT)
  const selected = filtered.find((a) => a.id === selectedId) ?? null

  function resetFilters() {
    setSearch('')
    setBank('')
    setCity('')
    setAccess('all')
  }

  function locate(id: string) {
    setSelectedId(id)
    setMobileView('map')
  }

  const bankOptions = [
    { value: '', label: ta.allBanks },
    ...banks.map((b) => ({ value: b, label: b })),
  ]
  const cityOptions = [
    { value: '', label: ta.allCities },
    ...cities.map((c) => ({ value: c, label: c })),
  ]
  const accessOptions = [
    { value: 'all', label: ta.access.all },
    { value: 'yes', label: ta.access.yes },
    { value: 'no', label: ta.access.no },
    { value: 'unknown', label: ta.access.unknown },
  ]

  // ── Provenance banner: real source + daily freshness, or a stale fallback ──
  const updatedText =
    lastUpdated !== null ? ta.updatedOn(formatDate(lastUpdated, language)) : ''

  let provenance: React.ReactNode = null
  if (status === 'success' && isStale) {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="font-medium">{ta.staleTitle}</span>
        <span className="text-muted">
          {ta.staleBody(formatDate(lastUpdated ?? Date.now(), language))}
        </span>
        <button
          type="button"
          onClick={retryAtms}
          className="ms-auto inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {ta.retry}
        </button>
      </div>
    )
  } else if (status === 'success') {
    provenance = (
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs text-muted">
        <Database className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span>
          {ta.source}: <bdi className="font-medium text-content">data.gov.il</bdi>
        </span>
        {updatedText && (
          <>
            <span className="text-faint" aria-hidden="true">
              ·
            </span>
            <span>{updatedText}</span>
          </>
        )}
        {isRefreshing && (
          <span className="ms-auto inline-flex items-center gap-1 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {ta.refreshing}
          </span>
        )}
      </div>
    )
  }

  // ── Loading (no cached data yet): skeletons, no misleading numbers ─────────
  if (status === 'loading' || status === 'idle') {
    return (
      <PageShell datasetId="atms" title={ta.title} description={ta.description} provenance={null}>
        <div className="flex items-center gap-2 rounded-card border border-edge bg-surface p-4 text-sm text-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
          <span>{ta.loadingBody}</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.05fr]">
          <ul className="space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-[4.5rem] animate-pulse rounded-card border border-edge bg-surface-2"
              />
            ))}
          </ul>
          <div
            className="hidden h-[32rem] animate-pulse rounded-card border border-edge bg-surface-2 lg:block"
            aria-hidden="true"
          />
        </div>
      </PageShell>
    )
  }

  // ── Hard error with no data to fall back on ────────────────────────────────
  if (status === 'error') {
    return (
      <PageShell datasetId="atms" title={ta.title} description={ta.description} provenance={null}>
        <EmptyState
          icon={AlertTriangle}
          title={ta.errorTitle}
          body={ta.errors[error ?? 'unknown']}
          action={
            <button
              type="button"
              onClick={retryAtms}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {ta.retry}
            </button>
          }
        />
      </PageShell>
    )
  }

  // ── Success (fresh or stale fallback) ──────────────────────────────────────
  return (
    <PageShell
      datasetId="atms"
      title={ta.title}
      description={ta.description}
      provenance={provenance}
    >
      {/* Filter bar */}
      <div className="rounded-card border border-edge bg-surface p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <SearchInput
            id="atm-search"
            label={ta.searchLabel}
            value={search}
            onChange={setSearch}
            placeholder={ta.searchPlaceholder}
          />
          <Select
            id="atm-bank"
            label={ta.bankFilter}
            value={bank}
            onChange={setBank}
            options={bankOptions}
          />
          <Select
            id="atm-city"
            label={ta.cityFilter}
            value={city}
            onChange={setCity}
            options={cityOptions}
          />
          <Select
            id="atm-access"
            label={ta.accessibilityFilter}
            value={access}
            onChange={(v) => setAccess(v as AccessFilter)}
            options={accessOptions}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {t.common.showing(filtered.length, atms.length)}
          </p>
          {(search || bank || city || access !== 'all') && (
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

      {/* Mobile view switch */}
      <div className="mt-4 lg:hidden">
        <Tabs
          ariaLabel={ta.title}
          value={mobileView}
          onChange={setMobileView}
          fill
          items={[
            { id: 'list', label: ta.listView, icon: List },
            { id: 'map', label: ta.mapView, icon: MapIcon },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          title={t.common.noResultsTitle}
          body={t.common.noResultsBody}
          action={
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t.common.resetFilters}
            </button>
          }
        />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.05fr]">
          {/* List */}
          <div className={mobileView === 'map' ? 'hidden lg:block' : ''}>
            <ul className="max-h-[32rem] space-y-2 overflow-y-auto pe-1">
              {visibleList.map((atm) => (
                <li key={atm.id}>
                  <AtmCard
                    atm={atm}
                    selected={atm.id === selectedId}
                    onSelect={() => setSelectedId(atm.id)}
                    onLocate={() => locate(atm.id)}
                  />
                </li>
              ))}
            </ul>
            {filtered.length > LIST_LIMIT && (
              <p className="mt-2 text-center text-xs text-muted">
                {ta.listTruncated(LIST_LIMIT, filtered.length)}
              </p>
            )}
          </div>

          {/* Map */}
          <div className={mobileView === 'list' ? 'hidden lg:block' : ''}>
            <div className="lg:sticky lg:top-32">
              <AtmMap
                className="h-[32rem]"
                atms={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                labels={{ atm: ta.atmLabel }}
                dir={dir}
              />
              {!selected && (
                <p className="mt-2 text-center text-xs text-muted">
                  {ta.selectHint}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

interface AtmCardProps {
  atm: Atm
  selected: boolean
  onSelect: () => void
  onLocate: () => void
}

/** One row in the result list: primary info + expandable details. */
function AtmCard({ atm, selected, onSelect, onLocate }: AtmCardProps) {
  const t = useT()
  const ta = t.atms
  const [expanded, setExpanded] = useState(false)

  const fullAddress = [atm.address, atm.additionalAddress]
    .filter(Boolean)
    .join(', ')

  // Only surface a service when the source explicitly marks it available.
  const services = [
    { ok: atm.cashWithdrawalAvailable, label: ta.service.withdrawal },
    { ok: atm.cashDepositAvailable, label: ta.service.cashDeposit },
    { ok: atm.chequeDepositAvailable, label: ta.service.chequeDeposit },
    { ok: atm.foreignExchangeAvailable, label: ta.service.forex },
  ].filter((s) => s.ok === true)

  const detailServices = [
    { v: atm.cashWithdrawalAvailable, label: ta.service.withdrawal },
    { v: atm.cashDepositAvailable, label: ta.service.cashDeposit },
    { v: atm.chequeDepositAvailable, label: ta.service.chequeDeposit },
    { v: atm.envelopeDepositAvailable, label: ta.service.envelopeDeposit },
    { v: atm.foreignExchangeAvailable, label: ta.service.forex },
    { v: atm.additionalTransactionsAvailable, label: ta.service.additionalTransactions },
    { v: atm.commissionAvailable, label: ta.service.commission },
  ]

  return (
    <div
      className={`rounded-card border bg-surface shadow-card transition-colors ${
        selected ? 'border-brand ring-1 ring-brand' : 'border-edge hover:border-faint'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full p-3 text-start"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15">
            <Building2
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-content">
                {atm.bankName || '—'}
              </p>
              {atm.atmNumber !== null && (
                <span className="shrink-0 font-mono text-[0.7rem] text-faint">
                  {ta.atmLabel} <bdi>{atm.atmNumber}</bdi>
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {[fullAddress, atm.city].filter(Boolean).join(', ') || '—'}
              </span>
            </p>
            {(services.length > 0 || atm.wheelchairAccessible === true) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted">
                {atm.wheelchairAccessible === true && (
                  <span className="inline-flex items-center gap-1 text-success">
                    <Accessibility className="h-3 w-3" aria-hidden="true" />
                    {ta.accessibleLabel}
                  </span>
                )}
                {services.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Banknote className="h-3 w-3" aria-hidden="true" />
                    {services.map((s) => s.label).join(' · ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>

      {/* Action row */}
      <div className="flex items-center justify-between border-t border-edge px-3 py-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-content"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          {expanded ? ta.hideDetails : ta.details}
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={atm.lat === null || atm.lng === null}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover disabled:cursor-not-allowed disabled:text-faint"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {atm.lat === null || atm.lng === null ? ta.noCoords : ta.locateOnMap}
        </button>
      </div>

      {/* Expandable details */}
      {expanded && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-edge p-3 text-xs">
          {atm.branchCode !== null && (
            <div>
              <dt className="text-muted">{ta.branchLabel}</dt>
              <dd className="font-medium text-content">
                <bdi>{atm.branchCode}</bdi>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted">{ta.accessibilityFilter}</dt>
            <dd className="font-medium text-content">
              {atm.wheelchairAccessible === true
                ? ta.accessibleLabel
                : atm.wheelchairAccessible === false
                  ? ta.notAccessibleLabel
                  : ta.accessibilityUnknownLabel}
            </dd>
          </div>
          {atm.locationDescription && (
            <div className="col-span-2">
              <dt className="text-muted">{ta.locationLabel}</dt>
              <dd className="font-medium text-content">{atm.locationDescription}</dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="mb-1 text-muted">{ta.servicesLabel}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {detailServices.map((s, i) => (
                <span
                  key={i}
                  className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                    s.v === true
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : s.v === false
                        ? 'bg-surface-2 text-faint line-through'
                        : 'bg-surface-2 text-faint'
                  }`}
                  title={
                    s.v === true ? undefined : s.v === false ? undefined : undefined
                  }
                >
                  {s.label}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}
