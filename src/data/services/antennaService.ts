import type { CellAntenna } from '../types'
import type { Language } from '../../i18n/translations'

/**
 * Client-side antenna logic — pure functions over an already-fetched
 * {@link CellAntenna} array. Network access and normalization live in
 * `antennaApi.ts`; persistence in `antennaCache.ts`; shared state in
 * `antennaStore.ts`. Keeping filtering/derivation here lets the page stay
 * declarative and means search/filter changes never hit the network.
 */

// ─── Query ───────────────────────────────────────────────────────────────────

export interface AntennaQuery {
  /** Free text over site id, company, city, address, and local authority. */
  search?: string
  company?: string
  city?: string
  siteType?: string
  radiationPermit?: string
}

/** Filter the loaded antennas for the current controls. Empty filters match all. */
export function queryAntennas(
  antennas: CellAntenna[],
  q: AntennaQuery = {},
): CellAntenna[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  return antennas.filter((a) => {
    if (q.company && a.company !== q.company) return false
    if (q.city && a.city !== q.city) return false
    if (q.siteType && a.siteType !== q.siteType) return false
    if (q.radiationPermit && a.radiationPermit !== q.radiationPermit) return false
    if (!search) return true
    return (
      a.siteId.toLowerCase().includes(search) ||
      a.company.toLowerCase().includes(search) ||
      a.city.toLowerCase().includes(search) ||
      a.address.toLowerCase().includes(search) ||
      a.localAuthority.toLowerCase().includes(search)
    )
  })
}

// ─── Derived option lists (from the real data, never hardcoded) ────────────────

/** Distinct non-empty values of a text field, sorted for Hebrew display. */
function distinctValues(
  antennas: CellAntenna[],
  pick: (a: CellAntenna) => string,
): string[] {
  const set = new Set<string>()
  for (const a of antennas) {
    const v = pick(a)
    if (v) set.add(v)
  }
  return [...set].sort((x, y) => x.localeCompare(y, 'he'))
}

export const getCompanies = (a: CellAntenna[]) => distinctValues(a, (x) => x.company)
export const getCities = (a: CellAntenna[]) => distinctValues(a, (x) => x.city)
export const getSiteTypes = (a: CellAntenna[]) => distinctValues(a, (x) => x.siteType)
export const getRadiationPermits = (a: CellAntenna[]) =>
  distinctValues(a, (x) => x.radiationPermit)

// ─── Summary ───────────────────────────────────────────────────────────────

/**
 * The source value of `היתר קרינה` indicating a radiation permit exists. Used
 * only to count records whose source status is literally "has a permit" — the
 * value is never reinterpreted beyond this exact match.
 */
const PERMIT_PRESENT = 'יש היתר'

/** Aggregate metrics over the loaded dataset. All derived, none hardcoded. */
export function antennaSummary(antennas: CellAntenna[]) {
  const companies = new Set<string>()
  const cities = new Set<string>()
  let withPermit = 0
  for (const a of antennas) {
    if (a.company) companies.add(a.company)
    if (a.city) cities.add(a.city)
    if (a.radiationPermit === PERMIT_PRESENT) withPermit++
  }
  return {
    total: antennas.length,
    companies: companies.size,
    cities: cities.size,
    withPermit,
  }
}

// ─── Date formatting ─────────────────────────────────────────────────────────

/**
 * Safely format a source date given as `DD/MM/YYYY`.
 *
 * The source strings are NOT ISO, so they must never be handed to
 * `new Date(str)` (which parses `DD/MM/YYYY` inconsistently across browsers).
 * We parse the parts explicitly and render via `Intl` from a UTC-anchored Date
 * so no timezone can shift the day.
 *
 *  - empty / missing  → `null` (caller shows a localized "Not available")
 *  - valid DD/MM/YYYY → locale-aware formatted date
 *  - non-empty but unparseable → the original string, preserved as-is
 */
export function formatGovDate(raw: string, language: Language): string | null {
  const s = raw.trim()
  if (!s) return null

  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (!m) return s // preserve an unexpected but non-empty value rather than hide it

  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return s

  const date = new Date(Date.UTC(year, month - 1, day))
  // Reject impossible dates that JS rolled over (e.g. 31/02 → 03/03).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return s
  }

  return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-GB', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
