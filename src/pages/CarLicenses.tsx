import { useRef, useState } from 'react'
import {
  BadgeCheck,
  Calendar,
  Car,
  Cog,
  Droplet,
  Fuel,
  Gauge,
  Hash,
  Palette,
  Search,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import SearchInput from '../components/ui/SearchInput'
import StatusBadge, { type BadgeTone } from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import type { RegistrationStatus, Vehicle } from '../data/types'
import {
  getExampleVehicles,
  isValidPlateInput,
  lookupVehicle,
} from '../data/services/vehicleService'
import type { Dict } from '../i18n/translations'
import { useLanguage, useT } from '../i18n/useLanguage'

const statusTone: Record<RegistrationStatus, BadgeTone> = {
  active: 'success',
  expired: 'warning',
  suspended: 'danger',
}

type Query = { status: 'idle' } | { status: 'found'; vehicle: Vehicle } | { status: 'empty'; plate: string }

export default function CarLicenses() {
  const t = useT()
  const { language } = useLanguage()
  const isHe = language === 'he'
  const tc = t.carLicenses

  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<Query>({ status: 'idle' })
  const inputRef = useRef<HTMLInputElement>(null)

  function runLookup(raw: string) {
    const value = raw.trim()
    if (!isValidPlateInput(value)) {
      setError(tc.invalid)
      setQuery({ status: 'idle' })
      return
    }
    setError(null)
    const vehicle = lookupVehicle(value)
    setQuery(vehicle ? { status: 'found', vehicle } : { status: 'empty', plate: value })
  }

  function onExample(plate: string) {
    setInput(plate)
    runLookup(plate)
    inputRef.current?.focus()
  }

  function reset() {
    setInput('')
    setError(null)
    setQuery({ status: 'idle' })
    inputRef.current?.focus()
  }

  const examples = getExampleVehicles(6)
  const fuelLabel = (v: Vehicle) => tc.fuel[v.fuel]
  const typeLabel = (v: Vehicle) => tc.type[v.vehicleType]

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(isHe ? 'he-IL' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  return (
    <PageShell datasetId="car-licenses" title={tc.title} description={tc.description}>
      {/* Prominent lookup — the page's center of gravity */}
      <section className="rounded-card border border-edge bg-surface p-5 shadow-card sm:p-6">
        <div className="mx-auto max-w-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SearchInput
              ref={inputRef}
              id="plate"
              label={tc.searchLabel}
              value={input}
              onChange={(v) => {
                setInput(v)
                if (error) setError(null)
              }}
              onClear={reset}
              onSubmit={() => runLookup(input)}
              placeholder={tc.placeholder}
              inputMode="numeric"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => runLookup(input)}
              className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              {tc.searchBtn}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          {/* Example plates — one-tap lookups */}
          <div className="mt-4">
            <p className="text-xs font-medium text-muted">{tc.examplesHint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {examples.map((v) => (
                <button
                  key={v.plate}
                  type="button"
                  onClick={() => onExample(v.plate)}
                  className="rounded-lg border border-edge bg-field px-2.5 py-1 font-mono text-sm text-content transition-colors hover:border-brand hover:text-brand"
                >
                  <bdi>{v.plate}</bdi>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Result region */}
      <section className="mt-6" aria-live="polite">
        {query.status === 'idle' && (
          <EmptyState icon={Car} title={tc.initialTitle} body={tc.initialBody} />
        )}

        {query.status === 'empty' && (
          <EmptyState
            icon={Search}
            title={tc.notFoundTitle}
            body={tc.notFoundBody(query.plate)}
            action={
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                {tc.newSearch}
              </button>
            }
          />
        )}

        {query.status === 'found' && (
          <VehiclePanel
            vehicle={query.vehicle}
            isHe={isHe}
            labels={tc.fields}
            statusLabel={tc.status[query.vehicle.status]}
            statusToneValue={statusTone[query.vehicle.status]}
            typeLabel={typeLabel(query.vehicle)}
            fuelLabel={fuelLabel(query.vehicle)}
            ownershipLabel={tc.ownership[query.vehicle.ownership]}
            resultTitle={tc.resultTitle}
            newSearch={tc.newSearch}
            onReset={reset}
            dateFmt={dateFmt}
          />
        )}
      </section>
    </PageShell>
  )
}

interface VehiclePanelProps {
  vehicle: Vehicle
  isHe: boolean
  labels: Dict['carLicenses']['fields']
  statusLabel: string
  statusToneValue: BadgeTone
  typeLabel: string
  fuelLabel: string
  ownershipLabel: string
  resultTitle: string
  newSearch: string
  onReset: () => void
  dateFmt: (iso: string) => string
}

function VehiclePanel({
  vehicle,
  isHe,
  labels,
  statusLabel,
  statusToneValue,
  typeLabel,
  fuelLabel,
  ownershipLabel,
  resultTitle,
  newSearch,
  onReset,
  dateFmt,
}: VehiclePanelProps) {
  const title = `${vehicle.manufacturer} ${vehicle.model}`
  const rows: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: Hash, label: labels.manufacturer, value: vehicle.manufacturer },
    { icon: Car, label: labels.model, value: `${vehicle.model}${vehicle.trim ? ` · ${vehicle.trim}` : ''}` },
    { icon: Calendar, label: labels.year, value: String(vehicle.year) },
    { icon: Cog, label: labels.vehicleType, value: typeLabel },
    { icon: Palette, label: labels.color, value: isHe ? vehicle.colorHe : vehicle.color },
    { icon: Fuel, label: labels.fuel, value: fuelLabel },
    ...(vehicle.engineCc
      ? [{ icon: Gauge, label: labels.engine, value: `${vehicle.engineCc} cc` }]
      : []),
    { icon: Users, label: labels.ownership, value: ownershipLabel },
    { icon: Calendar, label: labels.firstRegistered, value: dateFmt(vehicle.firstRegistered) },
    { icon: BadgeCheck, label: labels.lastTest, value: dateFmt(vehicle.lastTest) },
    { icon: Droplet, label: labels.nextTest, value: dateFmt(vehicle.nextTest) },
  ]

  return (
    <div className="animate-fade-in overflow-hidden rounded-card border border-edge bg-surface shadow-card">
      {/* Header band with the plate rendered as a license tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge bg-surface-2 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-md border-2 border-content/70 bg-surface px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-content">
            <bdi>{vehicle.plate}</bdi>
          </span>
          <div>
            <p className="text-xs text-muted">{resultTitle}</p>
            <p className="font-semibold text-content">{title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge tone={statusToneValue} label={statusLabel} />
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-brand hover:text-brand-hover"
          >
            {newSearch}
          </button>
        </div>
      </div>

      {/* Field grid */}
      <dl className="grid grid-cols-1 gap-x-8 gap-y-0 px-5 py-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center gap-3 border-b border-edge/60 py-3 last:border-0"
          >
            <row.icon className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
            <dt className="w-40 shrink-0 text-sm text-muted">{row.label}</dt>
            <dd className="min-w-0 flex-1 text-sm font-medium text-content">
              <bdi>{row.value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
