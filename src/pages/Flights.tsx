import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownUp,
  Database,
  Loader2,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCw,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import StatCard from '../components/ui/StatCard'
import StatusBadge, { type BadgeTone } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import type { Flight, FlightDirection, FlightStatusKey } from '../data/types'
import {
  directionCount,
  flightLabel,
  flightSummary,
  formatFlightTime,
  presentStatusKeys,
  queryFlights,
} from '../data/services/flightService'
import { initFlights, retryFlights, useFlightData } from '../data/services/flightStore'
import { useLanguage, useT } from '../i18n/useLanguage'

const PAGE_SIZE = 25

const STATUS_TONE: Record<FlightStatusKey, BadgeTone> = {
  onTime: 'success',
  notFinal: 'neutral',
  final: 'info',
  departed: 'success',
  landed: 'success',
  landing: 'info',
  delayed: 'warning',
  cancelled: 'danger',
  unknown: 'neutral',
}

/** Last-fetched clock (Israel time, HH:mm) — matches the board's local times. */
function formatClock(epoch: number, language: string): string {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(epoch))
}

export default function Flights() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const tf = t.flights

  const { status, flights, total, error, isStale, isRefreshing, lastUpdated } =
    useFlightData()

  // Load from the 1-hour cache / API once on mount.
  useEffect(() => {
    initFlights()
  }, [])

  const [direction, setDirection] = useState<FlightDirection>('departure')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FlightStatusKey | 'all'>('all')
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)

  // Debounce the search so filtering doesn't run on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  const summary = useMemo(() => flightSummary(flights), [flights])
  const statusKeys = useMemo(() => presentStatusKeys(flights), [flights])

  const results = useMemo(
    () => queryFlights(flights, { direction, search, status: statusFilter, sort }),
    [flights, direction, search, statusFilter, sort],
  )

  // Return to the first page whenever the tab/filters/sort change.
  useEffect(() => setPage(1), [direction, search, statusFilter, sort])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const statusOptions = [
    { value: 'all', label: tf.allStatuses },
    ...statusKeys.map((k) => ({ value: k, label: tf.status[k] })),
  ]

  const hasActiveFilters = Boolean(search || statusFilter !== 'all')

  // ── Provenance banner: real source + fetch freshness, or a stale fallback ──
  let provenance: React.ReactNode = null
  if (status === 'success' && isStale) {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span className="font-medium">{tf.staleTitle}</span>
        <span className="text-muted">
          {tf.staleBody(formatClock(lastUpdated ?? Date.now(), language))}
        </span>
        <button
          type="button"
          onClick={retryFlights}
          className="ms-auto inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {tf.retry}
        </button>
      </div>
    )
  } else if (status === 'success') {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs text-muted">
        <Database className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span>
          {tf.source}: <bdi className="font-medium text-content">{tf.sourceName}</bdi>
        </span>
        {lastUpdated !== null && (
          <>
            <span className="text-faint" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-content">
              {tf.updatedAt(formatClock(lastUpdated, language))}
            </span>
          </>
        )}
        <span className="text-faint" aria-hidden="true">
          ·
        </span>
        <span>{tf.liveNote}</span>
        {isRefreshing && (
          <span className="ms-auto inline-flex items-center gap-1 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {tf.refreshing}
          </span>
        )}
      </div>
    )
  }

  // ── Loading (no cached data yet): skeletons, no misleading numbers ─────────
  if (status === 'loading' || status === 'idle') {
    return (
      <PageShell datasetId="flights" title={tf.title} description={tf.description} provenance={null}>
        <div className="flex items-center gap-2 rounded-card border border-edge bg-surface p-4 text-sm text-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
          <span>{tf.loadingBody}</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-card border border-edge bg-surface shadow-card" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-edge/60 px-4 py-3.5 last:border-0">
              <div className="h-5 w-12 animate-pulse rounded bg-surface-2" />
              <div className="h-5 w-16 animate-pulse rounded bg-surface-2" />
              <div className="h-5 flex-1 animate-pulse rounded bg-surface-2" />
              <div className="h-5 w-20 animate-pulse rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </PageShell>
    )
  }

  // ── Hard error with no data to fall back on ────────────────────────────────
  if (status === 'error') {
    return (
      <PageShell datasetId="flights" title={tf.title} description={tf.description} provenance={null}>
        <EmptyState
          icon={AlertTriangle}
          title={tf.errorTitle}
          body={tf.errors[error ?? 'unknown']}
          action={
            <button
              type="button"
              onClick={retryFlights}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {tf.retry}
            </button>
          }
        />
      </PageShell>
    )
  }

  // ── Success (fresh or stale fallback) ──────────────────────────────────────
  return (
    <PageShell datasetId="flights" title={tf.title} description={tf.description} provenance={provenance}>
      {/* Summary strip — derived from the loaded dataset, never hardcoded */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={tf.summary.total}
          value={summary.total}
          icon={Plane}
          hint={summary.total !== total ? tf.totalNote(total) : undefined}
        />
        <StatCard
          label={tf.summary.departures}
          value={summary.departures}
          icon={PlaneTakeoff}
          accentBg="bg-indigo-50 dark:bg-indigo-500/15"
          accentText="text-indigo-600 dark:text-indigo-400"
        />
        <StatCard
          label={tf.summary.arrivals}
          value={summary.arrivals}
          icon={PlaneLanding}
          accentBg="bg-cyan-50 dark:bg-cyan-500/15"
          accentText="text-cyan-600 dark:text-cyan-400"
        />
        <StatCard
          label={tf.summary.disrupted}
          value={summary.disrupted}
          icon={AlertTriangle}
          accentBg="bg-amber-50 dark:bg-amber-500/15"
          accentText="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Direction tabs — filter the cached data locally */}
      <div className="mt-6">
        <Tabs
          ariaLabel={tf.title}
          value={direction}
          onChange={setDirection}
          items={[
            {
              id: 'departure',
              label: tf.departures,
              icon: PlaneTakeoff,
              count: directionCount(flights, 'departure'),
            },
            {
              id: 'arrival',
              label: tf.arrivals,
              icon: PlaneLanding,
              count: directionCount(flights, 'arrival'),
            },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <SearchInput
          id="flight-search"
          label={tf.searchLabel}
          value={searchInput}
          onChange={setSearchInput}
          placeholder={tf.searchPlaceholder}
        />
        <Select
          id="flight-status"
          label={tf.statusLabel}
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as FlightStatusKey | 'all')}
          options={statusOptions}
        />
        <button
          type="button"
          onClick={() => setSort((s) => (s === 'asc' ? 'desc' : 'asc'))}
          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-edge bg-field px-3 text-sm font-medium text-muted transition-colors hover:text-content"
        >
          <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
          {tf.sortLabel} ({sort === 'asc' ? '↑' : '↓'})
        </button>
      </div>

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {t.common.showing(results.length, directionCount(flights, direction))}
      </p>

      {/* Board */}
      <div className="mt-3">
        {results.length === 0 ? (
          <EmptyState
            title={t.common.noResultsTitle}
            body={hasActiveFilters ? t.common.noResultsBody : t.common.emptyTitle}
          />
        ) : (
          <>
            <FlightBoard flights={pageItems} direction={direction} isHe={isHe} />
            <Pagination className="mt-6" page={current} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </div>
    </PageShell>
  )
}

interface FlightBoardProps {
  flights: Flight[]
  direction: FlightDirection
  isHe: boolean
}

function FlightBoard({ flights, direction, isHe }: FlightBoardProps) {
  const t = useT()
  const tf = t.flights
  const isDeparture = direction === 'departure'
  const placeCol = isDeparture ? tf.col.destination : tf.col.origin

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-card border border-edge bg-surface shadow-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-surface-2 text-start text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 text-start font-semibold">{tf.col.time}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.flight}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.airline}</th>
              <th className="px-4 py-3 text-start font-semibold">{placeCol}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.terminal}</th>
              {isDeparture && (
                <th className="px-4 py-3 text-start font-semibold">{tf.col.checkIn}</th>
              )}
              <th className="px-4 py-3 text-start font-semibold">{tf.col.status}</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => (
              <tr key={f.id} className="border-b border-edge/60 last:border-0 hover:bg-surface-2/60">
                <td className="whitespace-nowrap px-4 py-3">
                  <TimeCell f={f} tf={tf} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-content">
                  <bdi>{flightLabel(f)}</bdi>
                </td>
                <td className="px-4 py-3 text-muted">{f.airlineName || tf.noValue}</td>
                <td className="px-4 py-3">
                  <PlaceCell f={f} isHe={isHe} noValue={tf.noValue} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {f.terminal ? <bdi>{tf.terminalShort}{f.terminal}</bdi> : tf.noValue}
                </td>
                {isDeparture && (
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    <CheckInCell f={f} tf={tf} />
                  </td>
                )}
                <td className="px-4 py-3">
                  <StatusBadge tone={STATUS_TONE[f.statusKey]} label={statusLabel(f, isHe, tf)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 sm:hidden">
        {flights.map((f) => (
          <li key={f.id} className="rounded-card border border-edge bg-surface p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <TimeCell f={f} tf={tf} big />
                <span className="font-mono text-sm text-muted">
                  <bdi>{flightLabel(f)}</bdi>
                </span>
              </div>
              <StatusBadge tone={STATUS_TONE[f.statusKey]} label={statusLabel(f, isHe, tf)} />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
              <PlaceCell f={f} isHe={isHe} noValue={tf.noValue} />
              <span className="text-muted">{f.airlineName}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {f.terminal && (
                <span>
                  <bdi>{tf.terminalShort}{f.terminal}</bdi>
                </span>
              )}
              {isDeparture && (f.checkInCounters || f.checkInZone) && (
                <span>
                  {tf.col.checkIn}: <CheckInCell f={f} tf={tf} />
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

type Tf = ReturnType<typeof useT>['flights']

/** Scheduled time, with the estimated time shown below only when it differs. */
function TimeCell({ f, tf, big = false }: { f: Flight; tf: Tf; big?: boolean }) {
  const scheduled = formatFlightTime(f.scheduledTime)
  const estimated = formatFlightTime(f.estimatedTime)
  const showEstimated = estimated && estimated !== scheduled
  return (
    <span className="inline-flex flex-col leading-tight">
      <span className={big ? 'text-lg font-bold text-content' : 'font-semibold text-content'}>
        <bdi>{scheduled || tf.noValue}</bdi>
      </span>
      {showEstimated && (
        <span className="text-xs text-warning">
          <bdi>{tf.estimated} {estimated}</bdi>
        </span>
      )}
    </span>
  )
}

/** Destination/origin — localized city with the IATA code as secondary text. */
function PlaceCell({ f, isHe, noValue }: { f: Flight; isHe: boolean; noValue: string }) {
  const city = (isHe ? f.cityHe : f.cityEn) || f.locationDesc || f.cityEn || f.cityHe
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-medium text-content">{city || noValue}</span>
      {f.locationCode && (
        <span className="font-mono text-xs text-faint">
          <bdi>{f.locationCode}</bdi>
        </span>
      )}
    </span>
  )
}

/** Check-in counters + zone, each shown only when present. */
function CheckInCell({ f, tf }: { f: Flight; tf: Tf }) {
  const parts: string[] = []
  if (f.checkInCounters) parts.push(f.checkInCounters)
  if (f.checkInZone) parts.push(`${tf.zoneShort} ${f.checkInZone}`)
  return <bdi>{parts.length ? parts.join(' · ') : tf.noValue}</bdi>
}

/**
 * Status label: a localized label for known categories, or the source's own
 * text for unrecognised values so they stay readable rather than hidden.
 */
function statusLabel(f: Flight, isHe: boolean, tf: Tf): string {
  if (f.statusKey === 'unknown') {
    return (isHe ? f.statusHe : f.statusEn) || tf.status.unknown
  }
  return tf.status[f.statusKey]
}
