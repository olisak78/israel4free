import { useEffect, useMemo, useState } from 'react'
import {
  Accessibility,
  ChevronDown,
  Clock,
  MapPin,
  Moon,
  Phone,
  Pill,
} from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import Select from '../components/ui/Select'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import type { Pharmacy } from '../data/types'
import {
  getPharmacyChains,
  getPharmacyCities,
  isOpenAt,
  pharmacyCount,
  queryPharmacies,
} from '../data/services/pharmacyService'
import { useLanguage, useT } from '../i18n/useLanguage'

const PAGE_SIZE = 9

export default function Pharmacies() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const tp = t.pharmacies

  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [chain, setChain] = useState('')
  const [onCallOnly, setOnCallOnly] = useState(false)
  const [page, setPage] = useState(1)

  // One "now" per mount — used to derive an open/closed indicator over the
  // illustrative hours. Not a live feed.
  const now = useMemo(() => new Date(), [])

  const results = useMemo(
    () => queryPharmacies({ search, city, chain, onCallOnly }),
    [search, city, chain, onCallOnly],
  )

  // Return to the first page whenever the filters change.
  useEffect(() => setPage(1), [search, city, chain, onCallOnly])

  const cities = useMemo(() => getPharmacyCities(), [])
  const chains = useMemo(() => getPharmacyChains(), [])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const pageItems = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function resetFilters() {
    setSearch('')
    setCity('')
    setChain('')
    setOnCallOnly(false)
  }

  return (
    <PageShell datasetId="pharmacies" title={tp.title} description={tp.description}>
      {/* Filters */}
      <div className="rounded-card border border-edge bg-surface p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
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
              ...cities.map((c) => ({ value: c.en, label: isHe ? c.he : c.en })),
            ]}
          />
          <Select
            id="ph-chain"
            label={tp.chainFilter}
            value={chain}
            onChange={setChain}
            options={[
              { value: '', label: tp.allChains },
              ...chains.map((c) => ({ value: c, label: c })),
            ]}
          />
          <button
            type="button"
            onClick={() => setOnCallOnly((v) => !v)}
            aria-pressed={onCallOnly}
            className={`inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${
              onCallOnly
                ? 'border-brand bg-brand-soft text-brand-soft-fg'
                : 'border-edge bg-field text-muted hover:text-content'
            }`}
          >
            <Moon className="h-4 w-4" aria-hidden="true" />
            {tp.onCallOnly}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {t.common.showing(results.length, pharmacyCount())}
          </p>
          {(search || city || chain || onCallOnly) && (
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
      {results.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Pill}
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
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((p) => (
              <PharmacyCard key={p.id} pharmacy={p} isHe={isHe} open={isOpenAt(p, now)} today={now.getDay()} />
            ))}
          </div>
          <Pagination className="mt-6" page={current} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </PageShell>
  )
}

interface PharmacyCardProps {
  pharmacy: Pharmacy
  isHe: boolean
  open: boolean
  today: number
}

function PharmacyCard({ pharmacy: p, isHe, open, today }: PharmacyCardProps) {
  const t = useT()
  const tp = t.pharmacies
  const [showHours, setShowHours] = useState(false)
  const todayHours = p.hours[today]

  return (
    <div className="flex flex-col rounded-card border border-edge bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/15">
            <Pill className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-content">
              {isHe ? p.nameHe : p.name}
            </h3>
            <p className="text-xs text-muted">{isHe ? p.chainHe : p.chain}</p>
          </div>
        </div>
        <StatusBadge
          tone={open ? 'success' : 'neutral'}
          label={open ? tp.openNow : tp.closedNow}
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
        <MapPin className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span className="truncate">
          {isHe ? p.addressHe : p.address}, {isHe ? p.cityHe : p.city}
        </span>
      </p>

      {/* Today's hours summary */}
      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
        <Clock className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
        <span>
          {tp.todayLabel}:{' '}
          {todayHours ? (
            <bdi className="font-medium text-content">
              {todayHours.open}–{todayHours.close}
            </bdi>
          ) : (
            <span className="font-medium text-content">{tp.closedLabel}</span>
          )}
        </span>
      </p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.onCall && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            <Moon className="h-3 w-3" aria-hidden="true" />
            {tp.onCall}
          </span>
        )}
        {p.accessible && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            <Accessibility className="h-3 w-3" aria-hidden="true" />
            {tp.accessible}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4 border-t border-edge pt-3">
        <a
          href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          <bdi dir="ltr">{p.phone}</bdi>
        </a>
        <button
          type="button"
          onClick={() => setShowHours((v) => !v)}
          aria-expanded={showHours}
          className="ms-auto inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-content"
        >
          {showHours ? tp.hideHours : tp.viewHours}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showHours ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Weekly hours (disclosure) */}
      {showHours && (
        <dl className="mt-3 space-y-1 border-t border-edge pt-3 text-sm">
          {p.hours.map((h, day) => (
            <div
              key={day}
              className={`flex items-center justify-between rounded px-2 py-0.5 ${
                day === today ? 'bg-brand-soft font-medium text-brand-soft-fg' : ''
              }`}
            >
              <dt className="text-muted">{tp.days[day]}</dt>
              <dd className={day === today ? '' : 'text-content'}>
                {h ? (
                  <bdi>
                    {h.open}–{h.close}
                  </bdi>
                ) : (
                  tp.closedLabel
                )}
              </dd>
            </div>
          ))}
          <p className="pt-1 text-[0.7rem] text-faint">{tp.hoursNote}</p>
        </dl>
      )}
    </div>
  )
}
