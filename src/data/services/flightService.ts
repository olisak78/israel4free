import type { Flight, FlightDirection, FlightStatusKey } from '../types'

/**
 * Client-side flight-board logic — pure functions over an already-fetched
 * {@link Flight} array. Network access and normalization live in
 * `flightApi.ts`; persistence in `flightCache.ts`; shared state in
 * `flightStore.ts`. Keeping filtering/sorting/derivation here lets the page
 * stay declarative and means tab/search/status changes never hit the network.
 */

// ─── Status mapping ──────────────────────────────────────────────────────────

/**
 * Map the source English status text (CHRMINE) to a canonical category. Keyed
 * by the uppercased, trimmed value so minor source variations collapse. Values
 * observed in the live feed: ON TIME, NOT FINAL, FINAL, DEPARTED, LANDED,
 * LANDING, DELAYED, CANCELED. Anything else falls through to `unknown`.
 */
const STATUS_KEY_MAP: Record<string, FlightStatusKey> = {
  'ON TIME': 'onTime',
  'NOT FINAL': 'notFinal',
  FINAL: 'final',
  DEPARTED: 'departed',
  LANDED: 'landed',
  LANDING: 'landing',
  DELAYED: 'delayed',
  CANCELED: 'cancelled',
  CANCELLED: 'cancelled',
}

/** Canonical status category for a raw source status string. */
export function statusKeyFromRaw(rawEn: string): FlightStatusKey {
  return STATUS_KEY_MAP[rawEn.trim().toUpperCase()] ?? 'unknown'
}

/** Display order for the status filter, most "in progress" first. */
export const STATUS_ORDER: FlightStatusKey[] = [
  'notFinal',
  'onTime',
  'final',
  'landing',
  'departed',
  'landed',
  'delayed',
  'cancelled',
  'unknown',
]

// ─── Time formatting ─────────────────────────────────────────────────────────

/**
 * Extract 'HH:mm' from a raw 'YYYY-MM-DDTHH:mm:ss' local-airport string.
 *
 * The source times carry no timezone, so we read the clock fields directly
 * rather than constructing a Date — this preserves the intended local airport
 * time and avoids an accidental UTC shift. Returns '' for missing/unparsable
 * input so the UI can show a placeholder instead of "Invalid Date".
 */
export function formatFlightTime(raw: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(raw)
  return m ? `${m[1]}:${m[2]}` : ''
}

/** Full flight identifier, e.g. "LY 315" (code omitted if absent). */
export function flightLabel(f: Flight): string {
  return f.airlineCode ? `${f.airlineCode} ${f.flightNumber}` : f.flightNumber
}

// ─── Query ───────────────────────────────────────────────────────────────────

export interface FlightQuery {
  direction: FlightDirection
  /** Free text over flight number, airline, location code/name, city, country. */
  search?: string
  /** Status filter by canonical key, or 'all'. */
  status?: FlightStatusKey | 'all'
  /** Sort by scheduled time. */
  sort?: 'asc' | 'desc'
}

/** Filter + sort the loaded flights for the current tab/controls. */
export function queryFlights(flights: Flight[], q: FlightQuery): Flight[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  const rows = flights.filter((f) => {
    if (f.direction !== q.direction) return false
    if (q.status && q.status !== 'all' && f.statusKey !== q.status) return false
    if (!search) return true
    return (
      flightLabel(f).toLowerCase().includes(search) ||
      f.airlineCode.toLowerCase().includes(search) ||
      f.airlineName.toLowerCase().includes(search) ||
      f.locationCode.toLowerCase().includes(search) ||
      f.locationDesc.toLowerCase().includes(search) ||
      f.cityEn.toLowerCase().includes(search) ||
      f.cityHe.includes(search) ||
      f.countryEn.toLowerCase().includes(search) ||
      f.countryHe.includes(search)
    )
  })

  const dir = q.sort === 'desc' ? -1 : 1
  // Scheduled strings are ISO-ordered, so lexical compare is chronological.
  // Flights with no scheduled time sort to the end regardless of direction.
  return rows.sort((a, b) => {
    if (!a.scheduledTime) return 1
    if (!b.scheduledTime) return -1
    return a.scheduledTime.localeCompare(b.scheduledTime) * dir
  })
}

/** Board summary counts over the loaded dataset (both directions). */
export function flightSummary(flights: Flight[]) {
  let departures = 0
  let arrivals = 0
  let disrupted = 0
  for (const f of flights) {
    if (f.direction === 'departure') departures++
    else arrivals++
    if (f.statusKey === 'delayed' || f.statusKey === 'cancelled') disrupted++
  }
  return { total: flights.length, departures, arrivals, disrupted }
}

/** Count per direction, for the tab badges. */
export function directionCount(
  flights: Flight[],
  direction: FlightDirection,
): number {
  let n = 0
  for (const f of flights) if (f.direction === direction) n++
  return n
}

/** Distinct status keys present in the dataset, in display order. */
export function presentStatusKeys(flights: Flight[]): FlightStatusKey[] {
  const seen = new Set<FlightStatusKey>()
  for (const f of flights) seen.add(f.statusKey)
  return STATUS_ORDER.filter((k) => seen.has(k))
}
