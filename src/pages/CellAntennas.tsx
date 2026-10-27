import { useMemo, useState } from 'react'
import {
  Building2,
  List,
  Map as MapIcon,
  Radio,
  RadioTower,
  Signal,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import StatCard from '../components/ui/StatCard'
import StatusBadge, { type BadgeTone } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import MapPreview from '../components/ui/MapPreview'
import type { AntennaStatus, CellAntenna, CellTechnology } from '../data/types'
import {
  antennaSummary,
  getAntennaCities,
  getAntennaOperators,
  queryAntennas,
} from '../data/services/antennaService'
import { useLanguage, useT } from '../i18n/useLanguage'

const STATUS_TONE: Record<AntennaStatus, BadgeTone> = {
  active: 'success',
  planned: 'info',
  maintenance: 'warning',
}

const TECHS: CellTechnology[] = ['3G', '4G', '5G']

// Distinct, theme-safe color per technology (badge + marker).
const TECH_CLASS: Record<CellTechnology, string> = {
  '3G': 'text-slate-500',
  '4G': 'text-amber-600 dark:text-amber-400',
  '5G': 'text-amber-500',
}

export default function CellAntennas() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const tn = t.antennas

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [operator, setOperator] = useState('')
  const [technology, setTechnology] = useState<CellTechnology | 'all'>('all')
  const [view, setView] = useState<'table' | 'map'>('table')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const results = useMemo(
    () => queryAntennas({ search, city, operator, technology }),
    [search, city, operator, technology],
  )
  const summary = useMemo(() => antennaSummary(), [])
  const cities = useMemo(() => getAntennaCities(), [])
  const operators = useMemo(() => getAntennaOperators(), [])

  function reset() {
    setSearch('')
    setCity('')
    setOperator('')
    setTechnology('all')
  }

  return (
    <PageShell datasetId="antennas" title={tn.title} description={tn.description}>
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label={tn.summary.total}
          value={summary.total}
          icon={RadioTower}
          accentBg="bg-amber-50 dark:bg-amber-500/15"
          accentText="text-amber-600 dark:text-amber-400"
          hint={tn.summaryNote}
        />
        <StatCard label={tn.summary.operators} value={summary.operators} icon={Building2} />
        <StatCard label={tn.summary.cities} value={summary.cities} icon={Radio} />
        <StatCard label={tn.summary.fiveG} value={summary.fiveG} icon={Signal} />
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <SearchInput
          id="ant-search"
          label={tn.searchLabel}
          value={search}
          onChange={setSearch}
          placeholder={tn.searchPlaceholder}
          className="sm:col-span-2 lg:col-span-1"
        />
        <Select
          id="ant-city"
          label={tn.cityFilter}
          value={city}
          onChange={setCity}
          options={[
            { value: '', label: tn.allCities },
            ...cities.map((c) => ({ value: c.en, label: isHe ? c.he : c.en })),
          ]}
        />
        <Select
          id="ant-operator"
          label={tn.operatorFilter}
          value={operator}
          onChange={setOperator}
          options={[
            { value: '', label: tn.allOperators },
            ...operators.map((o) => ({ value: o, label: o })),
          ]}
        />
        <Select
          id="ant-tech"
          label={tn.techFilter}
          value={technology}
          onChange={(v) => setTechnology(v as CellTechnology | 'all')}
          options={[
            { value: 'all', label: tn.allTech },
            ...TECHS.map((tech) => ({ value: tech, label: tech })),
          ]}
        />
      </div>

      {/* Count + view toggle */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {t.common.showing(results.length, summary.total)}
        </p>
        <Tabs
          ariaLabel={tn.title}
          value={view}
          onChange={setView}
          items={[
            { id: 'table', label: tn.listView, icon: List },
            { id: 'map', label: tn.mapView, icon: MapIcon },
          ]}
        />
      </div>

      {results.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={RadioTower}
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
      ) : view === 'map' ? (
        <div className="mt-4">
          <MapPreview
            className="h-[30rem]"
            points={results.map((a) => ({ id: a.id, lat: a.lat, lng: a.lng }))}
            selectedId={selectedId}
            onSelect={setSelectedId}
            caption={tn.mapCaption}
            ariaLabel={tn.mapAria}
            markerClass={(id) => {
              const a = results.find((x) => x.id === id)
              return a ? TECH_CLASS[a.technology] : 'text-brand'
            }}
            renderPopover={(id) => {
              const a = results.find((x) => x.id === id)
              if (!a) return null
              return (
                <div>
                  <p className="font-mono text-xs text-faint">
                    <bdi>{a.id}</bdi>
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-content">
                    {isHe ? a.operatorHe : a.operator}
                  </p>
                  <p className="text-xs text-muted">
                    {a.technology} · {a.band} · {isHe ? a.cityHe : a.city}
                  </p>
                </div>
              )
            }}
          />
          <p className="mt-2 text-center text-[0.7rem] text-faint">{tn.heightNote}</p>
        </div>
      ) : (
        <AntennaTable results={results} isHe={isHe} />
      )}
    </PageShell>
  )
}

function AntennaTable({ results, isHe }: { results: CellAntenna[]; isHe: boolean }) {
  const t = useT()
  const tn = t.antennas

  return (
    <div className="mt-4">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-card border border-edge bg-surface shadow-card lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 text-start font-semibold">{tn.col.site}</th>
              <th className="px-4 py-3 text-start font-semibold">{tn.col.operator}</th>
              <th className="px-4 py-3 text-start font-semibold">{tn.col.location}</th>
              <th className="px-4 py-3 text-start font-semibold">{tn.col.coords}</th>
              <th className="px-4 py-3 text-start font-semibold">{tn.col.tech}</th>
              <th className="px-4 py-3 text-start font-semibold">{tn.col.height}</th>
              <th className="px-4 py-3 text-start font-semibold">{tn.col.status}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((a) => (
              <tr key={a.id} className="border-b border-edge/60 last:border-0 hover:bg-surface-2/60">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-medium text-content">
                  <bdi>{a.id}</bdi>
                </td>
                <td className="px-4 py-3 text-content">{isHe ? a.operatorHe : a.operator}</td>
                <td className="px-4 py-3 text-muted">
                  {isHe ? a.addressHe : a.address}, {isHe ? a.cityHe : a.city}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-faint">
                  <bdi>
                    {a.lat.toFixed(3)}, {a.lng.toFixed(3)}
                  </bdi>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 font-semibold ${TECH_CLASS[a.technology]}`}>
                    <Signal className="h-3.5 w-3.5" aria-hidden="true" />
                    {a.technology}
                  </span>
                  <span className="ms-1 text-xs text-faint">
                    <bdi>{a.band}</bdi>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  <bdi>
                    {a.heightM} {tn.heightUnit}
                  </bdi>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={STATUS_TONE[a.status]} label={tn.status[a.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <ul className="space-y-2 lg:hidden">
        {results.map((a) => (
          <li key={a.id} className="rounded-card border border-edge bg-surface p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-content">
                <bdi>{a.id}</bdi>
              </span>
              <StatusBadge tone={STATUS_TONE[a.status]} label={tn.status[a.status]} />
            </div>
            <p className="mt-1 text-sm font-semibold text-content">
              {isHe ? a.operatorHe : a.operator}
            </p>
            <p className="text-xs text-muted">
              {isHe ? a.addressHe : a.address}, {isHe ? a.cityHe : a.city}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className={`inline-flex items-center gap-1 font-semibold ${TECH_CLASS[a.technology]}`}>
                <Signal className="h-3.5 w-3.5" aria-hidden="true" />
                {a.technology} · {a.band}
              </span>
              <span className="text-muted">
                <bdi>
                  {a.heightM} {tn.heightUnit}
                </bdi>
              </span>
              <span className="font-mono text-faint">
                <bdi>
                  {a.lat.toFixed(3)}, {a.lng.toFixed(3)}
                </bdi>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-[0.7rem] text-faint">{tn.heightNote}</p>
    </div>
  )
}
