import type { Flight, FlightDirection } from '../types'
import { statusKeyFromRaw } from './flightService'

/**
 * Flight data service — fetches and normalizes the real Israel Airports
 * Authority flight board from the data.gov.il CKAN datastore API. This is the
 * single seam between the remote API and the UI: pages consume normalized
 * {@link Flight} records and never see raw CKAN field names.
 *
 * Verified against the live API (Oct 2026): 1,910 records (952 departures,
 * 958 arrivals), CORS open (`access-control-allow-origin: *`), and a single
 * request returns the full set (server limit 32000). We still paginate
 * defensively by offset rather than assuming one page is complete, and read the
 * total from the response. The feed covers Ben Gurion Airport only — there is
 * no airport dimension in the data.
 */

export const FLIGHT_RESOURCE_ID = 'e83f763b-b7d7-479e-b172-ae981ddc6de5'
const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search'
const PAGE_SIZE = 32000
const MAX_PAGES = 50 // guard against a runaway pagination loop

/** Machine-readable failure codes; the UI maps these to localized messages. */
export type FlightErrorCode =
  | 'network'
  | 'http'
  | 'parse'
  | 'api'
  | 'shape'
  | 'empty'

export class FlightServiceError extends Error {
  code: FlightErrorCode
  constructor(code: FlightErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'FlightServiceError'
    this.code = code
  }
}

/** Raw CKAN record shape. Every field is optional/nullable in practice. */
export interface FlightApiRecord {
  _id: number
  CHOPER?: string | null
  CHFLTN?: string | null
  CHOPERD?: string | null
  CHSTOL?: string | null
  CHPTOL?: string | null
  CHAORD?: string | null
  CHLOC1?: string | null
  CHLOC1D?: string | null
  CHLOC1TH?: string | null
  CHLOC1T?: string | null
  CHLOC1CH?: string | null
  CHLOCCT?: string | null
  CHTERM?: number | string | null
  CHCINT?: string | null
  CHCKZN?: string | null
  CHRMINE?: string | null
  CHRMINH?: string | null
}

interface CkanResult {
  resource_id: string
  records: unknown
  total: unknown
  limit?: number
  _links?: { start?: string; next?: string }
}

interface CkanResponse {
  success: boolean
  result?: CkanResult
  error?: unknown
}

async function fetchPage(
  offset: number,
  signal?: AbortSignal,
): Promise<{ records: Record<string, unknown>[]; total: number }> {
  const url = `${BASE_URL}?resource_id=${FLIGHT_RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}`

  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new FlightServiceError('network')
  }

  if (!res.ok) throw new FlightServiceError('http', `HTTP ${res.status}`)

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new FlightServiceError('parse')
  }

  const data = json as CkanResponse
  // A failed response can still arrive with HTTP 200, so trust `success`.
  if (!data || data.success !== true) throw new FlightServiceError('api')
  if (!data.result || !Array.isArray(data.result.records)) {
    throw new FlightServiceError('shape')
  }

  const records = data.result.records.filter(
    (r): r is Record<string, unknown> => typeof r === 'object' && r !== null,
  )
  const total =
    typeof data.result.total === 'number'
      ? data.result.total
      : Number.parseInt(String(data.result.total), 10)

  return { records, total: Number.isFinite(total) ? total : records.length }
}

export interface FlightFetchResult {
  flights: Flight[]
  /** Total record count reported by the API (not hardcoded). */
  total: number
}

/**
 * Fetch the complete board, paginating by offset until all records reported by
 * `total` have been retrieved. Combines pages, then normalizes once.
 */
export async function fetchAllFlights(
  signal?: AbortSignal,
): Promise<FlightFetchResult> {
  const raw: Record<string, unknown>[] = []
  let total = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const { records, total: pageTotal } = await fetchPage(raw.length, signal)
    total = pageTotal
    raw.push(...records)
    // Stop once we've collected everything, or a page returned nothing.
    if (records.length === 0 || raw.length >= total) break
  }

  const flights = normalizeFlights(raw)
  if (flights.length === 0) throw new FlightServiceError('empty')
  return { flights, total }
}

// ─── Normalization ───────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

/** CHAORD → direction. 'D'→departure, 'A'→arrival; anything else is unusable. */
function toDirection(v: unknown): FlightDirection | null {
  const s = toStr(v).toUpperCase()
  if (s === 'D') return 'departure'
  if (s === 'A') return 'arrival'
  return null
}

/** A terminal of 0/empty means "not provided" in the source — treat as blank. */
function toTerminal(v: unknown): string {
  const s = toStr(v)
  return s === '0' ? '' : s
}

/** Normalize one raw CKAN record to a {@link Flight}, or `null` if unusable. */
export function normalizeFlight(raw: Record<string, unknown>): Flight | null {
  try {
    const rowId = toStr(raw._id)
    if (!rowId) return null

    // A flight with no resolvable direction can't be placed on either board.
    const direction = toDirection(raw.CHAORD)
    if (!direction) return null

    const statusEn = toStr(raw.CHRMINE)

    return {
      id: `fl-${rowId}`,
      airlineCode: toStr(raw.CHOPER),
      flightNumber: toStr(raw.CHFLTN),
      airlineName: toStr(raw.CHOPERD),
      direction,
      scheduledTime: toStr(raw.CHSTOL),
      estimatedTime: toStr(raw.CHPTOL),
      locationCode: toStr(raw.CHLOC1),
      locationDesc: toStr(raw.CHLOC1D),
      cityEn: toStr(raw.CHLOC1T),
      cityHe: toStr(raw.CHLOC1TH),
      countryEn: toStr(raw.CHLOCCT),
      countryHe: toStr(raw.CHLOC1CH),
      terminal: toTerminal(raw.CHTERM),
      checkInCounters: toStr(raw.CHCINT),
      checkInZone: toStr(raw.CHCKZN),
      statusEn,
      statusHe: toStr(raw.CHRMINH),
      statusKey: statusKeyFromRaw(statusEn),
    }
  } catch {
    // One malformed record must never crash the whole page.
    return null
  }
}

/** Normalize a batch, dropping only records that cannot be used at all. */
export function normalizeFlights(records: Record<string, unknown>[]): Flight[] {
  const out: Flight[] = []
  for (const r of records) {
    const flight = normalizeFlight(r)
    if (flight) out.push(flight)
  }
  return out
}
