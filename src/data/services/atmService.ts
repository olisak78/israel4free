import type { Atm } from '../types'
import { parseIsraeliCoords } from '../../lib/israeliGrid'

/**
 * ATM data service — fetches and normalizes the real ATM dataset from the
 * data.gov.il CKAN datastore API. This is the single seam between the remote
 * API and the UI: pages consume normalized {@link Atm} records and never see
 * raw CKAN field names.
 *
 * Verified against the live API (Oct 2026): ~2,959 records, CORS open
 * (`access-control-allow-origin: *`), and a single request returns the full
 * set (server limit 32000). We still paginate defensively by offset rather
 * than assuming one page is complete.
 */

export const ATM_RESOURCE_ID = '21fde05f-62e3-401b-81cf-5c385862026d'
const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search'
const PAGE_SIZE = 32000
const MAX_PAGES = 50 // guard against a runaway pagination loop

/** Machine-readable failure codes; the UI maps these to localized messages. */
export type AtmErrorCode =
  | 'network'
  | 'http'
  | 'parse'
  | 'api'
  | 'shape'
  | 'empty'

export class AtmServiceError extends Error {
  code: AtmErrorCode
  constructor(code: AtmErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AtmServiceError'
    this.code = code
  }
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
  const url = `${BASE_URL}?resource_id=${ATM_RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}`

  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new AtmServiceError('network')
  }

  if (!res.ok) throw new AtmServiceError('http', `HTTP ${res.status}`)

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new AtmServiceError('parse')
  }

  const data = json as CkanResponse
  // A failed response can still arrive with HTTP 200, so trust `success`.
  if (!data || data.success !== true) throw new AtmServiceError('api')
  if (!data.result || !Array.isArray(data.result.records)) {
    throw new AtmServiceError('shape')
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

export interface AtmFetchResult {
  atms: Atm[]
  /** Total record count reported by the API (not hardcoded). */
  total: number
}

/**
 * Fetch the complete dataset, paginating by offset until all records reported
 * by `total` have been retrieved. Combines pages, then normalizes once.
 */
export async function fetchAllAtms(signal?: AbortSignal): Promise<AtmFetchResult> {
  const raw: Record<string, unknown>[] = []
  let total = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const { records, total: pageTotal } = await fetchPage(raw.length, signal)
    total = pageTotal
    raw.push(...records)
    // Stop once we've collected everything, or a page returned nothing.
    if (records.length === 0 || raw.length >= total) break
  }

  const atms = normalizeAtms(raw)
  if (atms.length === 0) throw new AtmServiceError('empty')
  return { atms, total }
}

// ─── Normalization ───────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

function toInt(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null
  if (typeof v === 'string') {
    const n = Number.parseInt(v.trim(), 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Hebrew yes/no → boolean, preserving unknown as `null`. "כן"→true, "לא"→false.
 * Anything missing or unrecognised stays `null` so "unknown" is never shown as
 * a confirmed "No".
 */
function toYesNo(v: unknown): boolean | null {
  const s = toStr(v)
  if (!s) return null
  if (s === 'כן') return true
  if (s === 'לא') return false
  const lower = s.toLowerCase()
  if (lower === 'yes' || lower === 'true' || lower === '1') return true
  if (lower === 'no' || lower === 'false' || lower === '0') return false
  return null
}

/** Normalize one raw CKAN record to an {@link Atm}, or `null` if unusable. */
export function normalizeAtm(raw: Record<string, unknown>): Atm | null {
  try {
    const rowId = toStr(raw._id)
    const atmNumber = toInt(raw.Atm_Num)
    // Build a stable id from the datastore row id (unique per row).
    const id = rowId
      ? `atm-${rowId}`
      : atmNumber !== null
        ? `atm-num-${atmNumber}`
        : ''
    if (!id) return null

    const extra = toStr(raw.ATM_Address_Extra)
    const coords = parseIsraeliCoords(raw.X_Coordinate, raw.Y_Coordinate)

    return {
      id,
      bankCode: toInt(raw.Bank_Code),
      bankName: toStr(raw.Bank_Name),
      branchCode: toInt(raw.Branch_Code),
      subBranchCode: toInt(raw.Sub_Branch_Code),
      atmNumber,
      address: toStr(raw.ATM_Address),
      // "0" is used as an empty sentinel in the source for the extra line.
      additionalAddress: extra === '0' ? '' : extra,
      city: toStr(raw.City),
      commissionAvailable: toYesNo(raw.Commission),
      cashWithdrawalAvailable: toYesNo(raw.Casd_Withdrawal),
      cashDepositAvailable: toYesNo(raw.Cash_Deposit),
      chequeDepositAvailable: toYesNo(raw.Cheque_Deposit),
      envelopeDepositAvailable: toYesNo(raw.Envelope_Deposit),
      foreignExchangeAvailable: toYesNo(raw.Forex_Transaction),
      additionalTransactionsAvailable: toYesNo(raw.Additional_Transactions),
      locationDescription: toStr(raw.ATM_Location),
      wheelchairAccessible: toYesNo(raw.Handicap_Access),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }
  } catch {
    // One malformed record must never crash the whole page.
    return null
  }
}

/** Normalize a batch, dropping only records that cannot be used at all. */
export function normalizeAtms(records: Record<string, unknown>[]): Atm[] {
  const out: Atm[] = []
  for (const r of records) {
    const atm = normalizeAtm(r)
    if (atm) out.push(atm)
  }
  return out
}
