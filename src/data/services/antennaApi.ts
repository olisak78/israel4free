import type { CellAntenna } from '../types'
import { parseItmCoords } from '../../lib/israeliGrid'

/**
 * Cellular-antenna data service — fetches and normalizes the real cellular-site
 * registry from the data.gov.il CKAN datastore API. This is the single seam
 * between the remote API and the UI: pages consume normalized
 * {@link CellAntenna} records and never see raw (Hebrew) CKAN field names.
 *
 * Verified against the live API (Oct 2026): 8,531 records, CORS open
 * (`access-control-allow-origin: *` for the browser), and a single request
 * returns the full set (server limit 32000). We still paginate defensively by
 * offset — reading `total` from the response rather than assuming one page is
 * complete — and stop as soon as everything reported by `total` is collected.
 */

export const ANTENNA_RESOURCE_ID = '8935c8e5-ec77-421f-af86-d970583195f8'
const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search'
const PAGE_SIZE = 32000
const MAX_PAGES = 50 // guard against a runaway pagination loop

/** Machine-readable failure codes; the UI maps these to localized messages. */
export type AntennaErrorCode =
  | 'network'
  | 'http'
  | 'parse'
  | 'api'
  | 'shape'
  | 'empty'
  | 'partial'

export class AntennaServiceError extends Error {
  code: AntennaErrorCode
  constructor(code: AntennaErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AntennaServiceError'
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
  const url = `${BASE_URL}?resource_id=${ANTENNA_RESOURCE_ID}&limit=${PAGE_SIZE}&offset=${offset}`

  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new AntennaServiceError('network')
  }

  if (!res.ok) throw new AntennaServiceError('http', `HTTP ${res.status}`)

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new AntennaServiceError('parse')
  }

  const data = json as CkanResponse
  // A failed response can still arrive with HTTP 200, so trust `success`.
  if (!data || data.success !== true) throw new AntennaServiceError('api')
  if (!data.result || !Array.isArray(data.result.records)) {
    throw new AntennaServiceError('shape')
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

export interface AntennaFetchResult {
  antennas: CellAntenna[]
  /** Total record count reported by the API (not hardcoded). */
  total: number
}

/**
 * Fetch the complete dataset, paginating by offset until all records reported
 * by `total` have been retrieved. Combines pages, then normalizes once.
 *
 * If a subsequent page stops returning rows before `total` is reached, the set
 * is incomplete — we throw `partial` rather than silently presenting a partial
 * dataset as if it were the whole thing.
 */
export async function fetchAllAntennas(
  signal?: AbortSignal,
): Promise<AntennaFetchResult> {
  const raw: Record<string, unknown>[] = []
  let total = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const { records, total: pageTotal } = await fetchPage(raw.length, signal)
    total = pageTotal
    raw.push(...records)
    // Stop once we've collected everything the API reports.
    if (raw.length >= total) break
    // A page returned nothing but we haven't reached `total`: the dataset is
    // incomplete. Surface it rather than pretend the partial set is complete.
    if (records.length === 0) {
      throw new AntennaServiceError('partial')
    }
  }

  const antennas = normalizeAntennas(raw)
  if (antennas.length === 0) throw new AntennaServiceError('empty')
  return { antennas, total }
}

// ─── Normalization ───────────────────────────────────────────────────────────

function toStr(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

/** Parse a numeric field, tolerating strings; `null` when missing/unparseable. */
function toNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const n = Number.parseFloat(v.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Collapse the inconsistent internal whitespace seen in `טכנולוגיית שידור`. */
function normalizeTech(v: unknown): string {
  return toStr(v).replace(/\s+/g, ' ').trim()
}

/**
 * Validate a source document link. Accepts only an http(s) URL; upgrades http
 * to https because the documents host (documents.sviva.gov.il) serves the same
 * file over https and an http link would be blocked as mixed content on an
 * https page. Returns `null` for anything missing or not a valid http(s) URL,
 * so the UI omits the link rather than render a broken one.
 */
function cleanDocUrl(v: unknown): string | null {
  const s = toStr(v)
  if (!s) return null
  let url: URL
  try {
    url = new URL(s)
  } catch {
    return null
  }
  if (url.protocol === 'http:') {
    url.protocol = 'https:'
    return url.toString()
  }
  if (url.protocol === 'https:') return url.toString()
  return null
}

/** Normalize one raw CKAN record to a {@link CellAntenna}, or `null` if unusable. */
export function normalizeAntenna(raw: Record<string, unknown>): CellAntenna | null {
  try {
    const rowId = toStr(raw._id)
    if (!rowId) return null

    const coords = parseItmCoords(raw.X_ITM, raw.Y_ITM)

    return {
      id: `ant-${rowId}`,
      siteId: toStr(raw["מס' אתר"]),
      company: toStr(raw['חברה']),
      city: toStr(raw['עיר']),
      address: toStr(raw['כתובת האתר']),
      localAuthority: toStr(raw['רשות מקומית']),
      jurisdiction: toStr(raw['תחום שיפוט']),
      siteType: toStr(raw['סוג אתר']),
      constructionPermitDate: toStr(raw['תאריך היתר הקמה']),
      operatingPermitDate: toStr(raw['תאריך היתר הפעלה']),
      lastInspectionDate: toStr(raw['בדיקה תקופתית אחרונה']),
      radiationPermit: toStr(raw['היתר קרינה']),
      maxTheoreticalPower: toNum(raw['עוצמה מרבית תיאורטית בµW לסמר']),
      maxResultPercent: toNum(raw['תוצאה מירבית ב% ביחס לסף הבריאות']),
      maxResultLocation: toStr(raw['תאור נקודה בה התקבלה תוצאה מירבית']),
      constructionPermitUrl: cleanDocUrl(raw['קובץ הקמה']),
      operatingPermitUrl: cleanDocUrl(raw['קובץ הפעלה']),
      transmissionTech: normalizeTech(raw['טכנולוגיית שידור']),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }
  } catch {
    // One malformed record must never crash the whole page.
    return null
  }
}

/** Normalize a batch, dropping only records that cannot be used at all. */
export function normalizeAntennas(records: Record<string, unknown>[]): CellAntenna[] {
  const out: CellAntenna[] = []
  for (const r of records) {
    const a = normalizeAntenna(r)
    if (a) out.push(a)
  }
  return out
}
