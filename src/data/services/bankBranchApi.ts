import type { BankBranch } from '../types'
import type { Language } from '../../i18n/translations'
import { parseIsraeliCoords } from '../../lib/israeliGrid'

/**
 * Bank-branch data service — fetches and normalizes the real bank-branch
 * registry from the data.gov.il CKAN datastore API. This is the single seam
 * between the remote API and the UI: pages consume normalized {@link BankBranch}
 * records and never see raw CKAN field names.
 *
 * There are TWO language-specific source resources. The active UI language
 * selects which one is fetched — Hebrew returns Hebrew bank/branch/city names,
 * English returns English ones (though some fields, e.g. street address and the
 * accessibility value, remain Hebrew in both). The resources also differ in
 * primitive types (Bank_Code/Zip_Code/POB are numeric in Hebrew, strings in
 * English), so normalization is type-tolerant and identifiers are kept as
 * strings.
 *
 * Verified against the live API (Oct 2026): 1,157 records per language, CORS
 * open (`access-control-allow-origin: *`), and a single request returns the
 * full set (server limit 32000). We still paginate defensively by offset and
 * read `total` from the response rather than assuming one page is complete.
 */

/** The two language-specific CKAN resource ids. */
export const BANK_BRANCH_RESOURCES: Record<Language, string> = {
  he: '2202bada-4baf-45f5-aa61-8c5bad9646d3',
  en: '6f3bda2a-8cde-4b86-a1c8-2761862b1224',
}

const BASE_URL = 'https://data.gov.il/api/3/action/datastore_search'
const PAGE_SIZE = 32000
const MAX_PAGES = 50 // guard against a runaway pagination loop

/** Machine-readable failure codes; the UI maps these to localized messages. */
export type BankBranchErrorCode =
  | 'network'
  | 'http'
  | 'parse'
  | 'api'
  | 'shape'
  | 'empty'
  | 'partial'

export class BankBranchServiceError extends Error {
  code: BankBranchErrorCode
  constructor(code: BankBranchErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'BankBranchServiceError'
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
  resourceId: string,
  offset: number,
  signal?: AbortSignal,
): Promise<{ records: Record<string, unknown>[]; total: number }> {
  const url = `${BASE_URL}?resource_id=${resourceId}&limit=${PAGE_SIZE}&offset=${offset}`

  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') throw e
    throw new BankBranchServiceError('network')
  }

  if (!res.ok) throw new BankBranchServiceError('http', `HTTP ${res.status}`)

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new BankBranchServiceError('parse')
  }

  const data = json as CkanResponse
  // A failed response can still arrive with HTTP 200, so trust `success`.
  if (!data || data.success !== true) throw new BankBranchServiceError('api')
  if (!data.result || !Array.isArray(data.result.records)) {
    throw new BankBranchServiceError('shape')
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

export interface BankBranchFetchResult {
  branches: BankBranch[]
  /** Total record count reported by the API (not hardcoded). */
  total: number
}

/**
 * Fetch the complete dataset for one language, paginating by offset until all
 * records reported by `total` have been retrieved. Combines pages, then
 * normalizes once. Throws `partial` if a page returns nothing before `total` is
 * reached, rather than presenting an incomplete set as if it were complete.
 */
export async function fetchAllBankBranches(
  language: Language,
  signal?: AbortSignal,
): Promise<BankBranchFetchResult> {
  const resourceId = BANK_BRANCH_RESOURCES[language]
  const raw: Record<string, unknown>[] = []
  let total = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    const { records, total: pageTotal } = await fetchPage(resourceId, raw.length, signal)
    total = pageTotal
    raw.push(...records)
    if (raw.length >= total) break
    if (records.length === 0) throw new BankBranchServiceError('partial')
  }

  const branches = normalizeBankBranches(raw)
  if (branches.length === 0) throw new BankBranchServiceError('empty')
  return { branches, total }
}

// ─── Normalization ───────────────────────────────────────────────────────────

/** Coerce any primitive to a trimmed string; '' for null/undefined/objects. */
function toStr(v: unknown): string {
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return ''
}

/**
 * Hebrew yes/no → boolean, preserving unknown as `null`. The accessibility value
 * is Hebrew ("כן"/"לא") in BOTH resources. Anything missing or unrecognised
 * stays `null` so "unknown" is never shown as a confirmed "No".
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

/** Normalize one raw CKAN record to a {@link BankBranch}, or `null` if unusable. */
export function normalizeBankBranch(raw: Record<string, unknown>): BankBranch | null {
  try {
    const rowId = toStr(raw._id)
    const bankCode = toStr(raw.Bank_Code)
    const branchCode = toStr(raw.Branch_Code)
    // Prefer a stable business id (bank + branch); fall back to the row id.
    const id =
      bankCode && branchCode
        ? `bb-${bankCode}-${branchCode}-${rowId || '0'}`
        : rowId
          ? `bb-row-${rowId}`
          : ''
    if (!id) return null

    // Coordinates are WGS84 degrees: X_Coordinate=lat, Y_Coordinate=lng
    // (verified against Afula ≈ 32.60, 35.29). parseIsraeliCoords validates the
    // Israel bounding box and returns null for missing/zero/out-of-range values,
    // and does NOT convert these degree values as ITM (magnitude ≪ 1000).
    const coords = parseIsraeliCoords(raw.X_Coordinate, raw.Y_Coordinate)

    return {
      id,
      bankCode,
      bankName: toStr(raw.Bank_Name),
      branchCode,
      branchName: toStr(raw.Branch_Name),
      address: toStr(raw.Branch_Address),
      city: toStr(raw.City),
      zipCode: toStr(raw.Zip_Code),
      postOfficeBox: toStr(raw.POB),
      telephone: toStr(raw.Telephone),
      wheelchairAccessible: toYesNo(raw.Handicap_Access),
      weeklyClosedDay: toStr(raw.day_closed),
      branchType: toStr(raw.Branch_Type),
      openDate: toStr(raw.Open_Date),
      closeDate: toStr(raw.Close_Date),
      mergedBankCode: toStr(raw.Merge_Bank),
      mergedBranchCode: toStr(raw.Merge_Branch),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    }
  } catch {
    // One malformed record must never crash the whole page.
    return null
  }
}

/** Normalize a batch, dropping only records that cannot be used at all. */
export function normalizeBankBranches(records: Record<string, unknown>[]): BankBranch[] {
  const out: BankBranch[] = []
  for (const r of records) {
    const b = normalizeBankBranch(r)
    if (b) out.push(b)
  }
  return out
}
