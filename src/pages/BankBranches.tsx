import { useEffect, useMemo, useState } from 'react'
import {
  Accessibility,
  AlertTriangle,
  Building,
  Calendar,
  ChevronDown,
  Database,
  List,
  Loader2,
  Landmark,
  Map as MapIcon,
  MapPin,
  Phone,
  RefreshCw,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import StatCard from '../components/ui/StatCard'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import BankBranchMap from '../components/ui/BankBranchMap'
import type { BankBranch } from '../data/types'
import {
  bankBranchSummary,
  formatBankDate,
  getBanks,
  getBranchTypes,
  getCities,
  isClosed,
  queryBankBranches,
  telHref,
  type AccessFilter,
  type SortKey,
  type StatusFilter,
} from '../data/services/bankBranchService'
import {
  initBankBranches,
  retryBankBranches,
  useBankBranchData,
} from '../data/services/bankBranchStore'
import { useLanguage, useT } from '../i18n/useLanguage'

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

export default function BankBranches() {
  const t = useT()
  const { language, dir } = useLanguage()
  const tb = t.bankBranches

  const { status, branches, total, error, isStale, isRefreshing, lastUpdated } =
    useBankBranchData(language)

  // Load the resource for the active language on mount, and again whenever the
  // UI language changes — each language resolves from its own 30-day cache.
  useEffect(() => {
    initBankBranches(language)
  }, [language])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [bank, setBank] = useState('')
  const [city, setCity] = useState('')
  const [branchType, setBranchType] = useState('')
  const [access, setAccess] = useState<AccessFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('bank')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  // Debounce search so filtering doesn't run on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  // Bank / city / type options are language-specific values, so clear those
  // selections when the language changes (search text + other filters persist).
  useEffect(() => {
    setBank('')
    setCity('')
    setBranchType('')
    setSelectedId(null)
  }, [language])

  const banks = useMemo(() => getBanks(branches), [branches])
  const cities = useMemo(() => getCities(branches), [branches])
  const branchTypes = useMemo(() => getBranchTypes(branches), [branches])
  const summary = useMemo(() => bankBranchSummary(branches), [branches])

  const filtered = useMemo(
    () =>
      queryBankBranches(branches, {
        search,
        bank,
        city,
        branchType,
        access,
        status: statusFilter,
        sort,
      }),
    [branches, search, bank, city, branchType, access, statusFilter, sort],
  )

  const visibleList = filtered.slice(0, LIST_LIMIT)
  const mappable = useMemo(
    () => filtered.filter((b) => b.lat !== null && b.lng !== null),
    [filtered],
  )
  const missingCoords = filtered.length - mappable.length
  const selected = filtered.find((b) => b.id === selectedId) ?? null

  const hasActiveFilters = Boolean(
    search || bank || city || branchType || access !== 'all' || statusFilter !== 'all',
  )

  function resetFilters() {
    setSearchInput('')
    setSearch('')
    setBank('')
    setCity('')
    setBranchType('')
    setAccess('all')
    setStatusFilter('all')
  }

  function locate(id: string) {
    setSelectedId(id)
    setMobileView('map')
  }

  // ── Provenance banner: real source + freshness, or a stale fallback ─────────
  let provenance: React.ReactNode = null
  if (status === 'success' && isStale) {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="font-medium">{tb.staleTitle}</span>
        <span className="text-muted">
          {tb.staleBody(formatDate(lastUpdated ?? Date.now(), language))}
        </span>
        <button
          type="button"
          onClick={() => retryBankBranches(language)}
          className="ms-auto inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {tb.retry}
        </button>
      </div>
    )
  } else if (status === 'success') {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs text-muted">
        <Database className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span>
          {tb.source}: <bdi className="font-medium text-content">{tb.sourceName}</bdi>
        </span>
        {lastUpdated !== null && (
          <>
            <span className="text-faint" aria-hidden="true">·</span>
            <span className="font-medium text-content">
              {tb.updatedOn(formatDate(lastUpdated, language))}
            </span>
          </>
        )}
        <span className="text-faint" aria-hidden="true">·</span>
        <span>{tb.liveNote}</span>
        {isRefreshing && (
          <span className="ms-auto inline-flex items-center gap-1 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {tb.refreshing}
          </span>
        )}
      </div>
    )
  }

  // ── Loading (no cached data yet): skeletons, no misleading numbers ──────────
  if (status === 'loading' || status === 'idle') {
    return (
      <PageShell datasetId="bank-branches" title={tb.title} description={tb.description} provenance={null}>
        <div className="flex items-center gap-2 rounded-card border border-edge bg-surface p-4 text-sm text-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
          <span>{tb.loadingBody}</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.05fr]">
          <ul className="space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="h-[5.5rem] animate-pulse rounded-card border border-edge bg-surface-2" />
            ))}
          </ul>
          <div className="hidden h-[32rem] animate-pulse rounded-card border border-edge bg-surface-2 lg:block" aria-hidden="true" />
        </div>
      </PageShell>
    )
  }

  // ── Hard error with no data to fall back on ─────────────────────────────────
  if (status === 'error') {
    return (
      <PageShell datasetId="bank-branches" title={tb.title} description={tb.description} provenance={null}>
        <EmptyState
          icon={AlertTriangle}
          title={tb.errorTitle}
          body={tb.errors[error ?? 'unknown']}
          action={
            <button
              type="button"
              onClick={() => retryBankBranches(language)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {tb.retry}
            </button>
          }
        />
      </PageShell>
    )
  }

  // ── Success (fresh or stale fallback) ───────────────────────────────────────
  return (
    <PageShell datasetId="bank-branches" title={tb.title} description={tb.description} provenance={provenance}>
      {/* Summary metrics — derived from the loaded dataset, never hardcoded */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={tb.summary.total}
          value={summary.total.toLocaleString()}
          icon={Building}
          accentBg="bg-blue-50 dark:bg-blue-500/15"
          accentText="text-blue-600 dark:text-blue-400"
          hint={summary.total !== total ? tb.totalNote(total.toLocaleString()) : undefined}
        />
        <StatCard label={tb.summary.banks} value={summary.banks} icon={Landmark} />
        <StatCard label={tb.summary.cities} value={summary.cities} icon={MapPin} />
        <StatCard label={tb.summary.accessible} value={summary.accessible.toLocaleString()} icon={Accessibility} />
      </div>

      {/* Filter bar */}
      <div className="mt-6 rounded-card border border-edge bg-surface p-4 shadow-card">
        <SearchInput
          id="bb-search"
          label={tb.searchLabel}
          value={searchInput}
          onChange={setSearchInput}
          placeholder={tb.searchPlaceholder}
        />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            id="bb-bank"
            label={tb.bankFilter}
            value={bank}
            onChange={setBank}
            options={[{ value: '', label: tb.allBanks }, ...banks.map((b) => ({ value: b, label: b }))]}
          />
          <Select
            id="bb-city"
            label={tb.cityFilter}
            value={city}
            onChange={setCity}
            options={[{ value: '', label: tb.allCities }, ...cities.map((c) => ({ value: c, label: c }))]}
          />
          <Select
            id="bb-type"
            label={tb.typeFilter}
            value={branchType}
            onChange={setBranchType}
            options={[{ value: '', label: tb.allTypes }, ...branchTypes.map((v) => ({ value: v, label: v }))]}
          />
          <Select
            id="bb-access"
            label={tb.accessFilter}
            value={access}
            onChange={(v) => setAccess(v as AccessFilter)}
            options={[
              { value: 'all', label: tb.access.all },
              { value: 'yes', label: tb.access.yes },
              { value: 'no', label: tb.access.no },
              { value: 'unknown', label: tb.access.unknown },
            ]}
          />
          <Select
            id="bb-status"
            label={tb.statusFilter}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: 'all', label: tb.status.all },
              { value: 'active', label: tb.status.active },
              { value: 'closed', label: tb.status.closed },
            ]}
          />
          <Select
            id="bb-sort"
            label={tb.sortLabel}
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: 'bank', label: tb.sort.bank },
              { value: 'city', label: tb.sort.city },
              { value: 'branch', label: tb.sort.branch },
              { value: 'code', label: tb.sort.code },
            ]}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {t.common.showing(filtered.length, branches.length)}
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

      {/* Mobile view switch */}
      <div className="mt-4 lg:hidden">
        <Tabs
          ariaLabel={tb.title}
          value={mobileView}
          onChange={setMobileView}
          fill
          items={[
            { id: 'list', label: tb.listView, icon: List },
            { id: 'map', label: tb.mapView, icon: MapIcon },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Building}
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
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.05fr]">
          {/* List */}
          <div className={mobileView === 'map' ? 'hidden lg:block' : ''}>
            <ul className="max-h-[36rem] space-y-2 overflow-y-auto pe-1">
              {visibleList.map((b) => (
                <li key={b.id}>
                  <BranchCard
                    branch={b}
                    selected={b.id === selectedId}
                    onSelect={() => setSelectedId(b.id)}
                    onLocate={() => locate(b.id)}
                  />
                </li>
              ))}
            </ul>
            {filtered.length > LIST_LIMIT && (
              <p className="mt-2 text-center text-xs text-muted">
                {tb.listTruncated(LIST_LIMIT, filtered.length)}
              </p>
            )}
          </div>

          {/* Map */}
          <div className={mobileView === 'list' ? 'hidden lg:block' : ''}>
            <div className="lg:sticky lg:top-32">
              <BankBranchMap
                className="h-[36rem]"
                branches={mappable}
                selectedId={selectedId}
                onSelect={setSelectedId}
                labels={{ branch: tb.branchLabel }}
                dir={dir}
              />
              {missingCoords > 0 ? (
                <p className="mt-2 text-center text-xs text-muted">{tb.mapOmittedNote(missingCoords)}</p>
              ) : (
                !selected && <p className="mt-2 text-center text-xs text-muted">{tb.selectHint}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

interface BranchCardProps {
  branch: BankBranch
  selected: boolean
  onSelect: () => void
  onLocate: () => void
}

/** One row in the result list: primary info + expandable details. */
function BranchCard({ branch: b, selected, onSelect, onLocate }: BranchCardProps) {
  const t = useT()
  const { language } = useLanguage()
  const tb = t.bankBranches
  const [expanded, setExpanded] = useState(false)

  const date = (raw: string) => formatBankDate(raw, language) ?? tb.noValue
  const location = [b.address, b.city].filter(Boolean).join(', ')
  const closed = isClosed(b)
  const phone = telHref(b.telephone)

  return (
    <div
      className={`rounded-card border bg-surface shadow-card transition-colors ${
        selected ? 'border-brand ring-1 ring-brand' : 'border-edge hover:border-faint'
      }`}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="w-full p-3 text-start">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/15">
            <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-content">{b.bankName || tb.noValue}</p>
              {b.branchCode && (
                <span className="shrink-0 font-mono text-[0.7rem] text-faint">
                  {tb.branchLabel} <bdi>{b.branchCode}</bdi>
                </span>
              )}
            </div>
            {b.branchName && (
              <p className="truncate text-xs font-medium text-muted">{b.branchName}</p>
            )}
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{location || tb.noValue}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem]">
              {b.wheelchairAccessible === true && (
                <StatusBadge
                  tone="success"
                  label={
                    <span className="inline-flex items-center gap-1">
                      <Accessibility className="h-3 w-3" aria-hidden="true" />
                      {tb.accessible}
                    </span>
                  }
                />
              )}
              {closed && <StatusBadge tone="danger" label={tb.closedBadge} />}
              {b.branchType && <span className="text-muted">{b.branchType}</span>}
            </div>
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
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          {expanded ? tb.hideDetails : tb.details}
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={b.lat === null || b.lng === null}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover disabled:cursor-not-allowed disabled:text-faint"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {b.lat === null || b.lng === null ? tb.noCoords : tb.locateOnMap}
        </button>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-edge p-3">
          {/* Telephone — a clickable tel: link, number kept readable */}
          {phone && (
            <a
              href={phone}
              aria-label={tb.callAria(b.bankName || b.branchName || tb.branchLabel)}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-hover"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <bdi dir="ltr">{b.telephone}</bdi>
            </a>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-muted">{tb.field.accessibility}</dt>
              <dd className="font-medium text-content">
                {b.wheelchairAccessible === true
                  ? tb.accessible
                  : b.wheelchairAccessible === false
                    ? tb.notAccessible
                    : tb.accessibilityUnknown}
              </dd>
            </div>
            <Detail label={tb.field.branchType} value={b.branchType} fallback={tb.noValue} />
            {b.weeklyClosedDay && (
              <div>
                <dt className="text-muted">{tb.field.weeklyClosedDay}</dt>
                <dd className="font-medium text-content">
                  <bdi>{b.weeklyClosedDay}</bdi>
                </dd>
              </div>
            )}
            <Detail label={tb.field.openDate} value={date(b.openDate)} mono />
            {closed && (
              <div>
                <dt className="text-muted">{tb.field.closeDate}</dt>
                <dd className="font-medium text-danger">
                  <bdi>{date(b.closeDate)}</bdi>
                </dd>
              </div>
            )}
            <Detail label={tb.field.zipCode} value={b.zipCode} fallback={tb.noValue} mono />
            <Detail label={tb.field.pob} value={b.postOfficeBox} fallback={tb.noValue} mono />
            <Detail label={tb.field.bankCode} value={b.bankCode} fallback={tb.noValue} mono />
            {(b.mergedBankCode || b.mergedBranchCode) && (
              <Detail
                label={tb.field.merged}
                value={[b.mergedBankCode, b.mergedBranchCode].filter(Boolean).join(' / ')}
                mono
              />
            )}
            {b.lat !== null && b.lng !== null && (
              <div className="col-span-2">
                <dt className="text-muted">{tb.field.coordinates}</dt>
                <dd className="font-mono font-medium text-content">
                  <bdi>{b.lat.toFixed(5)}, {b.lng.toFixed(5)}</bdi>
                </dd>
              </div>
            )}
          </dl>

          <p className="mt-2 flex items-start gap-1 text-[0.7rem] text-faint">
            <Calendar className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            {tb.closingNote}
          </p>
        </div>
      )}
    </div>
  )
}

/** One labelled detail cell; hides itself when the value is an empty fallback. */
function Detail({
  label,
  value,
  fallback,
  mono,
}: {
  label: string
  value: string
  fallback?: string
  mono?: boolean
}) {
  if (fallback !== undefined && (!value || value === fallback)) return null
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className={`font-medium text-content ${mono ? 'font-mono' : ''}`}>
        <bdi>{value}</bdi>
      </dd>
    </div>
  )
}
