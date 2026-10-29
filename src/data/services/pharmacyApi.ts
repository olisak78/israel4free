import type { Pharmacy } from '../types'
import { safeDirectionsUrl } from '../../lib/mapsLink'

/**
 * Pharmacy data service — fetches and normalizes the real "pharmacies authorized
 * to sell medical cannabis" dataset from the data.gov.il CKAN datastore API.
 * This is the single seam between the remote API and the UI: pages consume
 * normalized {@link Pharmacy} records and never see raw CKAN field names or the
 * source's embedded HTML.
 *
 * Verified against the live API (Oct 2026): 423 records, CORS open
 * (`access-control-allow-origin: *`), and a single request returns the full set
 * (server limit 32000). We still paginate defensively by offset rather than
 * assuming one page is complete, and read the total from the response.
 */

export const PHARMACY_RESOURCE_ID = 'f635f611-5b6d-4b21-9cd3-ce7b14da6c11'
const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search'
const PAGE_SIZE = 32000
const MAX_PAGES = 50 // guard against a runaway pagination loop

/** Machine-readable failure codes; the UI maps these to localized messages. */
export type PharmacyErrorCode =
  | 'network'
  | 'http'
  | 'parse'
  | 'api'
  | 'shape'
  | 'empty'

export class PharmacyServiceError extends Error {
  code: PharmacyErrorCode
  constructor(code: PharmacyErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'PharmacyServiceError'
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
  const url = `${BASE_URL}?resource_id=${PHARMACY_RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}`

  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new PharmacyServiceError('network')
  }

  if (!res.ok) throw new PharmacyServiceError('http', `HTTP ${res.status}`)

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new PharmacyServiceError('parse')
  }

  const data = json as CkanResponse
  // A failed response can still arrive with HTTP 200, so trust `success`.
  if (!data || data.success !== true) throw new PharmacyServiceError('api')
  if (!data.result || !Array.isArray(data.result.records)) {
    throw new PharmacyServiceError('shape')
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

export interface PharmacyFetchResult {
  pharmacies: Pharmacy[]
  /** Total record count reported by the API (not hardcoded). */
  total: number
}

/**
 * Fetch the complete dataset, paginating by offset until all records reported by
 * `total` have been retrieved. Combines pages, then normalizes once.
 */
export async function fetchAllPharmacies(
  signal?: AbortSignal,
): Promise<PharmacyFetchResult> {
  const raw: Record<string, unknown>[] = []
  let total = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const { records, total: pageTotal } = await fetchPage(raw.length, signal)
    total = pageTotal
    raw.push(...records)
    // Stop once we've collected everything, or a page returned nothing.
    if (records.length === 0 || raw.length >= total) break
  }

  const pharmacies = normalizePharmacies(raw)
  if (pharmacies.length === 0) throw new PharmacyServiceError('empty')
  return { pharmacies, total }
}

// ─── Normalization ───────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

/**
 * Hebrew yes/no → boolean, preserving unknown as `null`. "כן"→true, "לא"→false.
 * Anything missing or unrecognised stays `null`, so "unknown" is never shown as
 * a confirmed "No".
 */
function toYesNo(v: unknown): boolean | null {
  const s = toStr(v)
  if (!s) return null
  if (s === 'כן') return true
  if (s === 'לא') return false
  const lower = s.toLowerCase()
  if (lower === 'yes' || lower === 'true') return true
  if (lower === 'no' || lower === 'false') return false
  return null
}

/** Normalize one raw CKAN record to a {@link Pharmacy}, or `null` if unusable. */
export function normalizePharmacy(raw: Record<string, unknown>): Pharmacy | null {
  try {
    const rowId = toStr(raw._id)
    if (!rowId) return null

    const street = toStr(raw.pharmacy_street)
    const city = toStr(raw.pharmacy_city)

    return {
      id: `ph-${rowId}`,
      name: toStr(raw.pharmacy_name),
      street,
      city,
      notes: toStr(raw.pharmacy_notes),
      delivery: toYesNo(raw.pharmacy_delivery),
      directionsUrl: safeDirectionsUrl(toStr(raw.map), street, city),
    }
  } catch {
    // One malformed record must never crash the whole page.
    return null
  }
}

/** Normalize a batch, dropping only records that cannot be used at all. */
export function normalizePharmacies(records: Record<string, unknown>[]): Pharmacy[] {
  const out: Pharmacy[] = []
  for (const r of records) {
    const pharmacy = normalizePharmacy(r)
    if (pharmacy) out.push(pharmacy)
  }
  return out
}
