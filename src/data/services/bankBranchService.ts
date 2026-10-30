import type { BankBranch } from '../types'
import type { Language } from '../../i18n/translations'

/**
 * Client-side bank-branch logic — pure functions over an already-fetched
 * {@link BankBranch} array. Network access and normalization live in
 * `bankBranchApi.ts`; persistence in `bankBranchCache.ts`; shared state in
 * `bankBranchStore.ts`. Keeping filtering/sorting/derivation here lets the page
 * stay declarative and means search/filter changes never hit the network.
 */

export type AccessFilter = 'all' | 'yes' | 'no' | 'unknown'
/** `active` = no recorded closure date; `closed` = a closure date is present. */
export type StatusFilter = 'all' | 'active' | 'closed'
export type SortKey = 'bank' | 'city' | 'branch' | 'code'

export interface BankBranchQuery {
  /** Free text over bank/branch names, codes, city, address, and telephone. */
  search?: string
  bank?: string
  city?: string
  branchType?: string
  access?: AccessFilter
  status?: StatusFilter
  sort?: SortKey
}

/** A branch is "closed" only when it has a non-empty recorded closure date. */
export function isClosed(b: BankBranch): boolean {
  return b.closeDate.trim() !== ''
}

/** Filter + sort the loaded branches for the current controls. */
export function queryBankBranches(
  branches: BankBranch[],
  q: BankBranchQuery = {},
): BankBranch[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  const rows = branches.filter((b) => {
    if (q.bank && b.bankName !== q.bank) return false
    if (q.city && b.city !== q.city) return false
    if (q.branchType && b.branchType !== q.branchType) return false
    if (q.access === 'yes' && b.wheelchairAccessible !== true) return false
    if (q.access === 'no' && b.wheelchairAccessible !== false) return false
    if (q.access === 'unknown' && b.wheelchairAccessible !== null) return false
    if (q.status === 'active' && isClosed(b)) return false
    if (q.status === 'closed' && !isClosed(b)) return false
    if (!search) return true
    return (
      b.bankName.toLowerCase().includes(search) ||
      b.branchName.toLowerCase().includes(search) ||
      b.branchCode.toLowerCase().includes(search) ||
      b.bankCode.toLowerCase().includes(search) ||
      b.city.toLowerCase().includes(search) ||
      b.address.toLowerCase().includes(search) ||
      b.telephone.toLowerCase().includes(search)
    )
  })

  return sortBranches(rows, q.sort ?? 'bank')
}

function sortBranches(rows: BankBranch[], key: SortKey): BankBranch[] {
  const copy = [...rows]
  const cmp = (a: string, b: string) => a.localeCompare(b, ['he', 'en'])
  switch (key) {
    case 'city':
      return copy.sort((a, b) => cmp(a.city, b.city) || cmp(a.bankName, b.bankName))
    case 'branch':
      return copy.sort((a, b) => cmp(a.branchName, b.branchName))
    case 'code':
      // Branch codes are numeric-ish strings; compare numerically when possible.
      return copy.sort((a, b) => {
        const na = Number(a.branchCode)
        const nb = Number(b.branchCode)
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
        return cmp(a.branchCode, b.branchCode)
      })
    case 'bank':
    default:
      return copy.sort(
        (a, b) => cmp(a.bankName, b.bankName) || cmp(a.city, b.city),
      )
  }
}

// ─── Derived option lists (from the real data, never hardcoded) ────────────────

function distinctValues(
  branches: BankBranch[],
  pick: (b: BankBranch) => string,
): string[] {
  const set = new Set<string>()
  for (const b of branches) {
    const v = pick(b)
    if (v) set.add(v)
  }
  return [...set].sort((x, y) => x.localeCompare(y, ['he', 'en']))
}

export const getBanks = (b: BankBranch[]) => distinctValues(b, (x) => x.bankName)
export const getCities = (b: BankBranch[]) => distinctValues(b, (x) => x.city)
export const getBranchTypes = (b: BankBranch[]) => distinctValues(b, (x) => x.branchType)

// ─── Summary ───────────────────────────────────────────────────────────────

/** Aggregate metrics over the loaded dataset. All derived, none hardcoded. */
export function bankBranchSummary(branches: BankBranch[]) {
  const banks = new Set<string>()
  const cities = new Set<string>()
  let accessible = 0
  for (const b of branches) {
    if (b.bankName) banks.add(b.bankName)
    if (b.city) cities.add(b.city)
    if (b.wheelchairAccessible === true) accessible++
  }
  return {
    total: branches.length,
    banks: banks.size,
    cities: cities.size,
    accessible,
  }
}

// ─── Date formatting ─────────────────────────────────────────────────────────

/**
 * Safely format a source date given as `DD/MM/YYYY`.
 *
 * The source strings are NOT ISO, so they must never be handed to
 * `new Date(str)`. We parse the parts explicitly and render via `Intl` from a
 * UTC-anchored Date so no timezone can shift the day.
 *
 *  - empty / missing  → `null` (caller shows a localized "Not available")
 *  - valid DD/MM/YYYY → locale-aware formatted date
 *  - non-empty but unparseable → the original string, preserved as-is
 */
export function formatBankDate(raw: string, language: Language): string | null {
  const s = raw.trim()
  if (!s) return null

  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (!m) return s

  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return s

  const date = new Date(Date.UTC(year, month - 1, day))
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

/**
 * Build a safe `tel:` href from a source telephone string. Keeps the displayed
 * number in its original readable form; only the href is sanitized to digits
 * and a leading `+`. Returns `null` when there are no usable digits.
 */
export function telHref(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, '')
  const digits = cleaned.replace(/\D/g, '')
  if (digits.length < 3) return null
  return `tel:${cleaned}`
}
