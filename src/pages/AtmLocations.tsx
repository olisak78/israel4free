import { useMemo, useState } from 'react'
import {
  Accessibility,
  Banknote,
  Building2,
  Clock,
  List,
  Map as MapIcon,
  MapPin,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import Tabs from '../components/ui/Tabs'
import EmptyState from '../components/ui/EmptyState'
import MapPreview from '../components/ui/MapPreview'
import type { AtmLocation } from '../data/types'
import {
  atmCount,
  getAtmBanks,
  getAtmCities,
  queryAtms,
} from '../data/services/atmService'
import { useLanguage, useT } from '../i18n/useLanguage'

export default function AtmLocations() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const ta = t.atms

  const [search, setSearch] = useState('')
  const [bank, setBank] = useState('')
  const [city, setCity] = useState('')
  const [accessibleOnly, setAccessibleOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')

  const results = useMemo(
    () => queryAtms({ search, bank, city, accessibleOnly }),
    [search, bank, city, accessibleOnly],
  )

  const banks = useMemo(() => getAtmBanks(), [])
  const cities = useMemo(() => getAtmCities(), [])

  // Keep the selection valid as filters change.
  const selected = results.find((a) => a.id === selectedId) ?? null

  function resetFilters() {
    setSearch('')
    setBank('')
    setCity('')
    setAccessibleOnly(false)
  }

  const bankOptions = [
    { value: '', label: ta.allBanks },
    ...banks.map((b) => ({ value: b, label: b })),
  ]
  const cityOptions = [
    { value: '', label: ta.allCities },
    ...cities.map((c) => ({ value: c.en, label: isHe ? c.he : c.en })),
  ]

  return (
    <PageShell datasetId="atms" title={ta.title} description={ta.description}>
      {/* Filter bar */}
      <div className="rounded-card border border-edge bg-surface p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
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
          <button
            type="button"
            onClick={() => setAccessibleOnly((v) => !v)}
            aria-pressed={accessibleOnly}
            className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
              accessibleOnly
                ? 'border-brand bg-brand-soft text-brand-soft-fg'
                : 'border-edge bg-field text-muted hover:text-content'
            }`}
          >
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            {ta.accessibleOnly}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {t.common.showing(results.length, atmCount())}
          </p>
          {(search || bank || city || accessibleOnly) && (
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

      {results.length === 0 ? (
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
              {results.map((atm) => (
                <li key={atm.id}>
                  <AtmCard
                    atm={atm}
                    isHe={isHe}
                    selected={atm.id === selectedId}
                    onSelect={() => {
                      setSelectedId(atm.id)
                      setMobileView('map')
                    }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Map */}
          <div className={mobileView === 'list' ? 'hidden lg:block' : ''}>
            <div className="lg:sticky lg:top-32">
              <MapPreview
                className="h-[32rem]"
                points={results.map((a) => ({ id: a.id, lat: a.lat, lng: a.lng }))}
                selectedId={selectedId}
                onSelect={setSelectedId}
                caption={ta.mapCaption}
                ariaLabel={ta.mapAria}
                markerClass={(id) =>
                  id === selectedId ? 'text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'
                }
                renderPopover={(id) => {
                  const a = results.find((x) => x.id === id)
                  if (!a) return null
                  return (
                    <div>
                      <p className="text-sm font-semibold text-content">
                        {isHe ? a.bankHe : a.bank}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {isHe ? a.addressHe : a.address}, {isHe ? a.cityHe : a.city}
                      </p>
                      <p className="mt-1 font-mono text-[0.7rem] text-faint">
                        <bdi>{a.id}</bdi>
                      </p>
                    </div>
                  )
                }}
              />
              {!selected && (
                <p className="mt-2 text-center text-xs text-muted">{ta.selectHint}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}

interface AtmCardProps {
  atm: AtmLocation
  isHe: boolean
  selected: boolean
  onSelect: () => void
}

function AtmCard({ atm, isHe, selected, onSelect }: AtmCardProps) {
  const t = useT()
  const ta = t.atms
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-card border bg-surface p-3 text-start shadow-card transition-colors ${
        selected ? 'border-brand ring-1 ring-brand' : 'border-edge hover:border-faint'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/15">
          <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-content">
              {isHe ? atm.bankHe : atm.bank}
            </p>
            <span className="shrink-0 font-mono text-[0.7rem] text-faint">
              <bdi>{atm.id}</bdi>
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {isHe ? atm.addressHe : atm.address}, {isHe ? atm.cityHe : atm.city}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {atm.open24h ? ta.open24h : ta.businessHours}
            </span>
            {atm.accessible && (
              <span className="inline-flex items-center gap-1 text-success">
                <Accessibility className="h-3 w-3" aria-hidden="true" />
                {ta.accessible}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Banknote className="h-3 w-3" aria-hidden="true" />
              {atm.services.map((s) => ta.service[s]).join(' · ')}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
