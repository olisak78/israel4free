import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  Calendar,
  ChevronDown,
  Database,
  ExternalLink,
  Info,
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  RadioTower,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import StatCard from '../components/ui/StatCard'
import StatusBadge, { type BadgeTone } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import AntennaMap from '../components/ui/AntennaMap'
import type { CellAntenna } from '../data/types'
import {
  antennaSummary,
  formatGovDate,
  getCities,
  getCompanies,
  getRadiationPermits,
  getSiteTypes,
  queryAntennas,
} from '../data/services/antennaService'
import {
  initAntennas,
  retryAntennas,
  useAntennaData,
} from '../data/services/antennaStore'
import { useLanguage, useT } from '../i18n/useLanguage'

// Cap the rendered list for performance; the map still plots every match.
const LIST_LIMIT = 200

/** Badge tone for a verbatim radiation-permit status — meaning is in the label. */
function permitTone(value: string): BadgeTone {
  if (value === 'יש היתר') return 'success'
  if (value === 'אין היתר') return 'warning'
  return 'neutral'
}

function formatDate(epoch: number, language: string): string {
  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(epoch))
}

export default function CellAntennas() {
  const t = useT()
  const { language, dir } = useLanguage()
  const tn = t.antennas

  const { status, antennas, total, error, isStale, isRefreshing, lastUpdated } =
    useAntennaData()

  // Load from the 72-hour cache / API once on mount.
  useEffect(() => {
    initAntennas()
  }, [])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState('')
  const [city, setCity] = useState('')
  const [siteType, setSiteType] = useState('')
  const [permit, setPermit] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  // Debounce the search so filtering doesn't run on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 250)
    return () => clearTimeout(id)
  }, [searchInput])

  // Filter options derived from the real dataset (never hardcoded).
  const companies = useMemo(() => getCompanies(antennas), [antennas])
  const cities = useMemo(() => getCities(antennas), [antennas])
  const siteTypes = useMemo(() => getSiteTypes(antennas), [antennas])
  const permits = useMemo(() => getRadiationPermits(antennas), [antennas])

  const summary = useMemo(() => antennaSummary(antennas), [antennas])

  const filtered = useMemo(
    () => queryAntennas(antennas, { search, company, city, siteType, radiationPermit: permit }),
    [antennas, search, company, city, siteType, permit],
  )

  const visibleList = filtered.slice(0, LIST_LIMIT)
  const mappable = useMemo(
    () => filtered.filter((a) => a.lat !== null && a.lng !== null),
    [filtered],
  )
  const missingCoords = filtered.length - mappable.length
  const selected = filtered.find((a) => a.id === selectedId) ?? null

  const hasActiveFilters = Boolean(search || company || city || siteType || permit)

  function resetFilters() {
    setSearchInput('')
    setSearch('')
    setCompany('')
    setCity('')
    setSiteType('')
    setPermit('')
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
        <span className="font-medium">{tn.staleTitle}</span>
        <span className="text-muted">
          {tn.staleBody(formatDate(lastUpdated ?? Date.now(), language))}
        </span>
        <button
          type="button"
          onClick={retryAntennas}
          className="ms-auto inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {tn.retry}
        </button>
      </div>
    )
  } else if (status === 'success') {
    provenance = (
      <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-edge bg-surface-2 px-3 py-2 text-xs text-muted">
        <Database className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span>
          {tn.source}: <bdi className="font-medium text-content">{tn.sourceName}</bdi>
        </span>
        {lastUpdated !== null && (
          <>
            <span className="text-faint" aria-hidden="true">·</span>
            <span className="font-medium text-content">
              {tn.updatedOn(formatDate(lastUpdated, language))}
            </span>
          </>
        )}
        <span className="text-faint" aria-hidden="true">·</span>
        <span>{tn.liveNote}</span>
        {isRefreshing && (
          <span className="ms-auto inline-flex items-center gap-1 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            {tn.refreshing}
          </span>
        )}
      </div>
    )
  }

  // ── Loading (no cached data yet): skeletons, no misleading numbers ──────────
  if (status === 'loading' || status === 'idle') {
    return (
      <PageShell datasetId="antennas" title={tn.title} description={tn.description} provenance={null}>
        <div className="flex items-center gap-2 rounded-card border border-edge bg-surface p-4 text-sm text-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
          <span>{tn.loadingBody}</span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.05fr]">
          <ul className="space-y-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-[5.5rem] animate-pulse rounded-card border border-edge bg-surface-2"
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

  // ── Hard error with no data to fall back on ─────────────────────────────────
  if (status === 'error') {
    return (
      <PageShell datasetId="antennas" title={tn.title} description={tn.description} provenance={null}>
        <EmptyState
          icon={AlertTriangle}
          title={tn.errorTitle}
          body={tn.errors[error ?? 'unknown']}
          action={
            <button
              type="button"
              onClick={retryAntennas}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {tn.retry}
            </button>
          }
        />
      </PageShell>
    )
  }

  // ── Success (fresh or stale fallback) ───────────────────────────────────────
  return (
    <PageShell datasetId="antennas" title={tn.title} description={tn.description} provenance={provenance}>
      {/* Scope notice — keeps the dataset's meaning honest */}
      <div className="mb-6 flex items-start gap-2 rounded-lg border border-edge bg-surface-2 px-3 py-2.5 text-xs leading-relaxed text-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <p>{tn.scopeNote}</p>
      </div>

      {/* Summary metrics — derived from the loaded dataset, never hardcoded */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={tn.summary.total}
          value={summary.total.toLocaleString()}
          icon={RadioTower}
          accentBg="bg-amber-50 dark:bg-amber-500/15"
          accentText="text-amber-600 dark:text-amber-400"
          hint={summary.total !== total ? tn.totalNote(total) : undefined}
        />
        <StatCard label={tn.summary.companies} value={summary.companies} icon={Building2} />
        <StatCard label={tn.summary.cities} value={summary.cities} icon={MapPin} />
        <StatCard
          label={tn.summary.withPermit}
          value={summary.withPermit.toLocaleString()}
          icon={ShieldCheck}
          hint={tn.withPermitNote}
        />
      </div>

      {/* Filter bar */}
      <div className="mt-6 rounded-card border border-edge bg-surface p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
          <SearchInput
            id="ant-search"
            label={tn.searchLabel}
            value={searchInput}
            onChange={setSearchInput}
            placeholder={tn.searchPlaceholder}
            className="lg:col-span-3"
          />
          <Select
            id="ant-company"
            label={tn.companyFilter}
            value={company}
            onChange={setCompany}
            options={[
              { value: '', label: tn.allCompanies },
              ...companies.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            id="ant-city"
            label={tn.cityFilter}
            value={city}
            onChange={setCity}
            options={[
              { value: '', label: tn.allCities },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <Select
            id="ant-site-type"
            label={tn.siteTypeFilter}
            value={siteType}
            onChange={setSiteType}
            options={[
              { value: '', label: tn.allSiteTypes },
              ...siteTypes.map((s) => ({ value: s, label: s })),
            ]}
          />
          <Select
            id="ant-permit"
            label={tn.permitFilter}
            value={permit}
            onChange={setPermit}
            options={[
              { value: '', label: tn.allPermits },
              ...permits.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {t.common.showing(filtered.length, antennas.length)}
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
          ariaLabel={tn.title}
          value={mobileView}
          onChange={setMobileView}
          fill
          items={[
            { id: 'list', label: tn.listView, icon: List },
            { id: 'map', label: tn.mapView, icon: MapIcon },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={RadioTower}
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
              {visibleList.map((a) => (
                <li key={a.id}>
                  <AntennaCard
                    antenna={a}
                    selected={a.id === selectedId}
                    onSelect={() => setSelectedId(a.id)}
                    onLocate={() => locate(a.id)}
                  />
                </li>
              ))}
            </ul>
            {filtered.length > LIST_LIMIT && (
              <p className="mt-2 text-center text-xs text-muted">
                {tn.listTruncated(LIST_LIMIT, filtered.length)}
              </p>
            )}
          </div>

          {/* Map */}
          <div className={mobileView === 'list' ? 'hidden lg:block' : ''}>
            <div className="lg:sticky lg:top-32">
              <AntennaMap
                className="h-[36rem]"
                antennas={mappable}
                selectedId={selectedId}
                onSelect={setSelectedId}
                labels={{ site: tn.col.site }}
                dir={dir}
              />
              {missingCoords > 0 ? (
                <p className="mt-2 text-center text-xs text-muted">
                  {tn.mapOmittedNote(missingCoords)}
                </p>
              ) : (
                !selected && (
                  <p className="mt-2 text-center text-xs text-muted">{tn.selectHint}</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

interface AntennaCardProps {
  antenna: CellAntenna
  selected: boolean
  onSelect: () => void
  onLocate: () => void
}

/** One row in the result list: primary info + expandable details. */
function AntennaCard({ antenna: a, selected, onSelect, onLocate }: AntennaCardProps) {
  const t = useT()
  const { language } = useLanguage()
  const tn = t.antennas
  const [expanded, setExpanded] = useState(false)

  const date = (raw: string) => formatGovDate(raw, language) ?? tn.noValue
  const location = [a.address, a.city].filter(Boolean).join(', ')

  return (
    <div
      className={`rounded-card border bg-surface shadow-card transition-colors ${
        selected ? 'border-brand ring-1 ring-brand' : 'border-edge hover:border-faint'
      }`}
    >
      <button type="button" onClick={onSelect} aria-pressed={selected} className="w-full p-3 text-start">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-500/15">
            <RadioTower className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-content">{a.company || tn.noValue}</p>
              {a.siteId && (
                <span className="shrink-0 font-mono text-[0.7rem] text-faint">
                  {tn.col.site} <bdi>{a.siteId}</bdi>
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{location || tn.noValue}</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem]">
              {a.radiationPermit && (
                <StatusBadge
                  tone={permitTone(a.radiationPermit)}
                  label={<bdi>{a.radiationPermit}</bdi>}
                />
              )}
              {a.siteType && <span className="text-muted">{a.siteType}</span>}
              {a.lastInspectionDate && (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  <bdi>{date(a.lastInspectionDate)}</bdi>
                </span>
              )}
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
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          {expanded ? tn.hideDetails : tn.details}
        </button>
        <button
          type="button"
          onClick={onLocate}
          disabled={a.lat === null || a.lng === null}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hover disabled:cursor-not-allowed disabled:text-faint"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {a.lat === null || a.lng === null ? tn.noCoords : tn.locateOnMap}
        </button>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-edge p-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Detail label={tn.field.localAuthority} value={a.localAuthority} fallback={tn.noValue} />
            <Detail label={tn.field.jurisdiction} value={a.jurisdiction} fallback={tn.noValue} />
            <Detail label={tn.field.constructionPermitDate} value={date(a.constructionPermitDate)} mono />
            <Detail label={tn.field.operatingPermitDate} value={date(a.operatingPermitDate)} mono />
            <Detail label={tn.field.lastInspection} value={date(a.lastInspectionDate)} mono />
            <Detail label={tn.field.technology} value={a.transmissionTech} fallback={tn.noValue} />
          </dl>

          {/* Radiation measurements */}
          <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-wide text-faint">
            {tn.measurementsLabel}
          </p>
          <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Detail
              label={tn.field.maxPower}
              help={tn.powerHelp}
              value={
                a.maxTheoreticalPower !== null
                  ? `${a.maxTheoreticalPower.toLocaleString(language === 'he' ? 'he-IL' : 'en-US')} ${tn.powerUnit}`
                  : tn.noValue
              }
              mono
            />
            <Detail
              label={tn.field.maxResult}
              help={tn.resultHelp}
              value={a.maxResultPercent !== null ? `${a.maxResultPercent}%` : tn.noValue}
              mono
            />
            {a.maxResultLocation && (
              <div className="col-span-2">
                <dt className="text-muted">{tn.field.maxResultLocation}</dt>
                <dd className="font-medium text-content">{a.maxResultLocation}</dd>
              </div>
            )}
            {(a.lat !== null && a.lng !== null) && (
              <div className="col-span-2">
                <dt className="text-muted">{tn.field.coordinates}</dt>
                <dd className="font-mono font-medium text-content">
                  <bdi>{a.lat.toFixed(5)}, {a.lng.toFixed(5)}</bdi>
                </dd>
              </div>
            )}
          </dl>

          {/* Permit documents */}
          {(a.constructionPermitUrl || a.operatingPermitUrl) && (
            <>
              <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-wide text-faint">
                {tn.permitsLabel}
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {a.constructionPermitUrl && (
                  <DocLink url={a.constructionPermitUrl} label={tn.constructionDoc} aria={tn.docAria(tn.constructionDoc)} />
                )}
                {a.operatingPermitUrl && (
                  <DocLink url={a.operatingPermitUrl} label={tn.operatingDoc} aria={tn.docAria(tn.operatingDoc)} />
                )}
              </div>
            </>
          )}
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
  help,
  mono,
}: {
  label: string
  value: string
  fallback?: string
  help?: string
  mono?: boolean
}) {
  // When a text field is empty we pass the fallback explicitly; skip rendering
  // optional (fallback-provided) cells that have no real value.
  if (fallback !== undefined && (!value || value === fallback)) return null
  return (
    <div>
      <dt className="text-muted" title={help}>
        {label}
        {help && <span className="ms-0.5 cursor-help text-faint" aria-hidden="true">ⓘ</span>}
      </dt>
      <dd className={`font-medium text-content ${mono ? 'font-mono' : ''}`}>
        <bdi>{value}</bdi>
      </dd>
    </div>
  )
}

/** An accessible, clearly-marked external link to an official permit document. */
function DocLink({ url, label, aria }: { url: string; label: string; aria: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface-2 px-2.5 py-1 text-xs font-medium text-brand underline-offset-2 hover:border-brand hover:underline"
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </a>
  )
}
