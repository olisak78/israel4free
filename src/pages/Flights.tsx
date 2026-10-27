import { useMemo, useState } from 'react'
import {
  ArrowDownUp,
  PlaneLanding,
  PlaneTakeoff,
  Plane,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import StatCard from '../components/ui/StatCard'
import StatusBadge, { type BadgeTone } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import type { Flight, FlightDirection, FlightStatus } from '../data/types'
import {
  AIRPORTS,
  directionCount,
  flightSummary,
  queryFlights,
} from '../data/services/flightService'
import { useLanguage, useT } from '../i18n/useLanguage'

const STATUS_TONE: Record<FlightStatus, BadgeTone> = {
  scheduled: 'neutral',
  boarding: 'info',
  departed: 'success',
  landed: 'success',
  delayed: 'warning',
  cancelled: 'danger',
}

const STATUS_ORDER: FlightStatus[] = [
  'scheduled',
  'boarding',
  'departed',
  'landed',
  'delayed',
  'cancelled',
]

export default function Flights() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const tf = t.flights

  const [airport, setAirport] = useState(AIRPORTS[0].code)
  const [direction, setDirection] = useState<FlightDirection>('departure')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FlightStatus | 'all'>('all')
  const [sort, setSort] = useState<'asc' | 'desc'>('asc')

  const results = useMemo(
    () => queryFlights({ airport, direction, search, status, sort }),
    [airport, direction, search, status, sort],
  )
  const summary = useMemo(() => flightSummary(airport), [airport])
  const activeAirport = AIRPORTS.find((a) => a.code === airport)!

  const statusOptions = [
    { value: 'all', label: tf.allStatuses },
    ...STATUS_ORDER.map((s) => ({ value: s, label: tf.status[s] })),
  ]

  const airportSelect = (
    <Select
      id="airport"
      label={tf.airportLabel}
      value={airport}
      onChange={setAirport}
      options={AIRPORTS.map((a) => ({
        value: a.code,
        label: `${isHe ? a.nameHe : a.name} (${a.code})`,
      }))}
      className="min-w-[14rem]"
    />
  )

  return (
    <PageShell
      datasetId="flights"
      title={tf.title}
      description={tf.description}
      headerActions={airportSelect}
    >
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={tf.summary.total} value={summary.total} icon={Plane} hint={tf.summaryNote} />
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
          label={tf.summary.delayed}
          value={summary.delayed}
          icon={AlertTriangle}
          accentBg="bg-amber-50 dark:bg-amber-500/15"
          accentText="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Direction tabs */}
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
              count: directionCount(airport, 'departure'),
            },
            {
              id: 'arrival',
              label: tf.arrivals,
              icon: PlaneLanding,
              count: directionCount(airport, 'arrival'),
            },
          ]}
        />
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <SearchInput
          id="flight-search"
          label={tf.searchLabel}
          value={search}
          onChange={setSearch}
          placeholder={tf.searchPlaceholder}
        />
        <Select
          id="flight-status"
          label={tf.statusLabel}
          value={status}
          onChange={(v) => setStatus(v as FlightStatus | 'all')}
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

      {/* Board */}
      <div className="mt-4">
        {results.length === 0 ? (
          <EmptyState title={t.common.noResultsTitle} body={t.common.noResultsBody} />
        ) : (
          <FlightBoard
            flights={results}
            direction={direction}
            isHe={isHe}
            airportLabel={isHe ? activeAirport.nameHe : activeAirport.name}
          />
        )}
      </div>
    </PageShell>
  )
}

interface FlightBoardProps {
  flights: Flight[]
  direction: FlightDirection
  isHe: boolean
  airportLabel: string
}

function FlightBoard({ flights, direction, isHe }: FlightBoardProps) {
  const t = useT()
  const tf = t.flights
  const placeCol = direction === 'departure' ? tf.col.destination : tf.col.origin

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-card border border-edge bg-surface shadow-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-surface-2 text-start text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 text-start font-semibold">{tf.col.time}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.flight}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.airline}</th>
              <th className="px-4 py-3 text-start font-semibold">{placeCol}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.terminal}</th>
              <th className="px-4 py-3 text-start font-semibold">{tf.col.status}</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => {
              const delayed = f.estimated !== f.scheduled
              return (
                <tr
                  key={f.id}
                  className="border-b border-edge/60 last:border-0 hover:bg-surface-2/60"
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-semibold text-content">
                      <bdi>{f.scheduled}</bdi>
                    </span>
                    {delayed && (
                      <span className="ms-2 text-xs text-warning">
                        <bdi>{tf.estimated} {f.estimated}</bdi>
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-content">
                    <bdi>{f.flightNumber}</bdi>
                  </td>
                  <td className="px-4 py-3 text-muted">{isHe ? f.airlineHe : f.airline}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-content">
                      {isHe ? f.counterpartCityHe : f.counterpartCity}
                    </span>
                    <span className="ms-1.5 font-mono text-xs text-faint">
                      <bdi>{f.counterpartCode}</bdi>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    <bdi>
                      {tf.terminalShort}
                      {f.terminal}
                      {f.gate ? ` · ${tf.gateShort} ${f.gate}` : ''}
                    </bdi>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={STATUS_TONE[f.status]} label={tf.status[f.status]} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 sm:hidden">
        {flights.map((f) => {
          const delayed = f.estimated !== f.scheduled
          return (
            <li
              key={f.id}
              className="rounded-card border border-edge bg-surface p-3 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-content">
                    <bdi>{f.scheduled}</bdi>
                  </span>
                  <span className="font-mono text-sm text-muted">
                    <bdi>{f.flightNumber}</bdi>
                  </span>
                </div>
                <StatusBadge tone={STATUS_TONE[f.status]} label={tf.status[f.status]} />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-content">
                  {isHe ? f.counterpartCityHe : f.counterpartCity}
                  <span className="ms-1 font-mono text-xs text-faint">
                    <bdi>{f.counterpartCode}</bdi>
                  </span>
                </span>
                <span className="text-muted">{isHe ? f.airlineHe : f.airline}</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <bdi>
                    {tf.terminalShort}
                    {f.terminal}
                    {f.gate ? ` · ${tf.gateShort} ${f.gate}` : ''}
                  </bdi>
                </span>
                {delayed && (
                  <span className="text-warning">
                    <bdi>{tf.estimated} {f.estimated}</bdi>
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
