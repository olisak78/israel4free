import { useMemo, useState } from 'react'
import {
  Accessibility,
  ArrowLeft,
  Bus,
  Clock,
  MapPin,
  Navigation,
  Train,
  TramFront,
  Umbrella,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/ui/EmptyState'
import type { TransitMode, TransitRoute, TransitStop } from '../data/types'
import {
  getRoute,
  getRouteNumbers,
  getStopCities,
  queryRoutes,
  queryStops,
  transitCounts,
} from '../data/services/transitService'
import { useLanguage, useT } from '../i18n/useLanguage'

const MODE_ICON: Record<TransitMode, LucideIcon> = {
  bus: Bus,
  train: Train,
  lightrail: TramFront,
}

export default function PublicTransit() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const tt = t.transit

  const [tab, setTab] = useState<'stops' | 'routes'>('stops')

  return (
    <PageShell datasetId="transit" title={tt.title} description={tt.description}>
      <Tabs
        ariaLabel={tt.title}
        value={tab}
        onChange={setTab}
        items={[
          { id: 'stops', label: tt.stopsTab, icon: MapPin, count: transitCounts.stops },
          { id: 'routes', label: tt.routesTab, icon: Navigation, count: transitCounts.routes },
        ]}
      />

      <div className="mt-4">
        {tab === 'stops' ? <StopsTab isHe={isHe} /> : <RoutesTab isHe={isHe} />}
      </div>
    </PageShell>
  )
}

// ── Stops ────────────────────────────────────────────────────────────────────
function StopsTab({ isHe }: { isHe: boolean }) {
  const t = useT()
  const tt = t.transit
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [route, setRoute] = useState('')

  const results = useMemo(() => queryStops({ search, city, route }), [search, city, route])
  const cities = useMemo(() => getStopCities(), [])
  const routeNumbers = useMemo(() => getRouteNumbers(), [])

  function reset() {
    setSearch('')
    setCity('')
    setRoute('')
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:items-end">
        <SearchInput
          id="stop-search"
          label={tt.searchStops}
          value={search}
          onChange={setSearch}
          placeholder={tt.searchStopsPlaceholder}
        />
        <Select
          id="stop-city"
          label={tt.cityFilter}
          value={city}
          onChange={setCity}
          options={[
            { value: '', label: tt.allCities },
            ...cities.map((c) => ({ value: c.en, label: isHe ? c.he : c.en })),
          ]}
        />
        <Select
          id="stop-route"
          label={tt.routeFilter}
          value={route}
          onChange={setRoute}
          options={[
            { value: '', label: tt.allRoutes },
            ...routeNumbers.map((r) => ({ value: r, label: r })),
          ]}
        />
      </div>

      <p className="mt-3 text-sm text-muted" aria-live="polite">
        {t.common.showing(results.length, transitCounts.stops)}
      </p>

      {results.length === 0 ? (
        <EmptyState
          className="mt-3"
          title={t.common.noResultsTitle}
          body={t.common.noResultsBody}
          action={
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-brand hover:text-brand-hover"
            >
              {t.common.resetFilters}
            </button>
          }
        />
      ) : (
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => (
            <li key={s.id}>
              <StopCard stop={s} isHe={isHe} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function StopCard({ stop, isHe }: { stop: TransitStop; isHe: boolean }) {
  const t = useT()
  const tt = t.transit
  return (
    <div className="h-full rounded-card border border-edge bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-content">
          {isHe ? stop.nameHe : stop.name}
        </h3>
        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.7rem] text-muted">
          <bdi>{stop.id}</bdi>
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
        <MapPin className="h-3 w-3" aria-hidden="true" />
        {isHe ? stop.cityHe : stop.city}
      </p>

      <div className="mt-3">
        <p className="mb-1 text-[0.7rem] font-medium uppercase tracking-wide text-faint">
          {tt.servedRoutes}
        </p>
        <div className="flex flex-wrap gap-1">
          {stop.routes.map((r) => (
            <span
              key={r}
              className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300"
            >
              <bdi>{r}</bdi>
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-edge pt-3 text-xs text-muted">
        {stop.accessible && (
          <span className="inline-flex items-center gap-1 text-success">
            <Accessibility className="h-3 w-3" aria-hidden="true" />
            {tt.accessible}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Umbrella className="h-3 w-3" aria-hidden="true" />
          {stop.shelter ? tt.shelter : tt.noShelter}
        </span>
      </div>
    </div>
  )
}

// ── Routes (master-detail) ────────────────────────────────────────────────────
function RoutesTab({ isHe }: { isHe: boolean }) {
  const t = useT()
  const tt = t.transit
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const routes = useMemo(() => queryRoutes(search), [search])
  const selected = selectedId ? getRoute(selectedId) : undefined

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr]">
      {/* Route list — hidden on mobile when a route is open */}
      <div className={selected ? 'hidden lg:block' : ''}>
        <SearchInput
          id="route-search"
          label={tt.searchRoutes}
          value={search}
          onChange={setSearch}
          placeholder={tt.searchRoutesPlaceholder}
        />
        {routes.length === 0 ? (
          <EmptyState className="mt-3" title={t.common.noResultsTitle} body={t.common.noResultsBody} />
        ) : (
          <ul className="mt-3 space-y-2">
            {routes.map((r) => (
              <li key={r.id}>
                <RouteListItem
                  route={r}
                  isHe={isHe}
                  selected={r.id === selectedId}
                  onSelect={() => setSelectedId(r.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Detail */}
      <div className={selected ? '' : 'hidden lg:block'}>
        {selected ? (
          <RouteDetail route={selected} isHe={isHe} onBack={() => setSelectedId(null)} />
        ) : (
          <EmptyState icon={Navigation} title={tt.selectRoute} body={tt.selectRouteBody} />
        )}
      </div>
    </div>
  )
}

function RouteBadge({ route }: { route: TransitRoute }) {
  const Icon = MODE_ICON[route.mode]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-2.5 py-1 text-sm font-bold text-white dark:bg-cyan-500">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <bdi>{route.number}</bdi>
    </span>
  )
}

function RouteListItem({
  route,
  isHe,
  selected,
  onSelect,
}: {
  route: TransitRoute
  isHe: boolean
  selected: boolean
  onSelect: () => void
}) {
  const t = useT()
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-card border bg-surface p-3 text-start shadow-card transition-colors ${
        selected ? 'border-brand ring-1 ring-brand' : 'border-edge hover:border-faint'
      }`}
    >
      <RouteBadge route={route} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-content">
          {isHe ? route.originHe : route.origin} ←→ {isHe ? route.destinationHe : route.destination}
        </span>
        <span className="text-xs text-muted">
          {t.transit.mode[route.mode]} · {isHe ? route.operatorHe : route.operator}
        </span>
      </span>
    </button>
  )
}

function RouteDetail({
  route,
  isHe,
  onBack,
}: {
  route: TransitRoute
  isHe: boolean
  onBack: () => void
}) {
  const t = useT()
  const tt = t.transit
  const stops = isHe ? route.stopsHe : route.stops

  return (
    <div className="rounded-card border border-edge bg-surface p-5 shadow-card">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover lg:hidden"
      >
        <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        {tt.backToRoutes}
      </button>

      <div className="flex items-center gap-3">
        <RouteBadge route={route} />
        <div>
          <p className="text-sm font-semibold text-content">
            {isHe ? route.originHe : route.origin} ←→ {isHe ? route.destinationHe : route.destination}
          </p>
          <p className="text-xs text-muted">
            {tt.mode[route.mode]} · {isHe ? route.operatorHe : route.operator}
          </p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-content">
        <Clock className="h-4 w-4 text-muted" aria-hidden="true" />
        {tt.everyMin(route.frequencyMin)}
      </div>
      <p className="mt-1 text-[0.7rem] text-faint">{tt.frequencyNote}</p>

      {/* Stop sequence — transit-map style */}
      <div className="mt-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          {tt.stopsOnLine}
        </p>
        <ol className="relative ms-1.5 border-s-2 border-cyan-500/40 ps-5">
          {stops.map((stopName, i) => {
            const endpoint = i === 0 || i === stops.length - 1
            return (
              <li key={i} className="relative pb-5 last:pb-0">
                <span
                  className={`absolute -start-[1.6rem] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
                    endpoint
                      ? 'border-cyan-600 bg-cyan-600 dark:border-cyan-400 dark:bg-cyan-400'
                      : 'border-cyan-500 bg-surface'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-sm ${endpoint ? 'font-semibold text-content' : 'text-muted'}`}
                >
                  {stopName}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
