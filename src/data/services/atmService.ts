import type { AtmLocation } from '../types'
import { ATM_BANKS, MOCK_ATMS } from '../mock/mockAtms'

/**
 * ATM location service — the seam that a real data.gov.il ATM resource would
 * replace. Pages call these selectors and never touch the mock array.
 */

export interface AtmQuery {
  /** Free text over name, address, and city. */
  search?: string
  /** Bank name, or '' for all. */
  bank?: string
  /** City (English key) or '' for all. */
  city?: string
  /** Only accessible ATMs. */
  accessibleOnly?: boolean
}

export function queryAtms(q: AtmQuery = {}): AtmLocation[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  return MOCK_ATMS.filter((a) => {
    if (q.bank && a.bank !== q.bank) return false
    if (q.city && a.city !== q.city) return false
    if (q.accessibleOnly && !a.accessible) return false
    if (!search) return true
    return (
      a.name.toLowerCase().includes(search) ||
      a.nameHe.includes(search) ||
      a.address.toLowerCase().includes(search) ||
      a.addressHe.includes(search) ||
      a.city.toLowerCase().includes(search) ||
      a.cityHe.includes(search)
    )
  })
}

/** Distinct cities present in the data, with Hebrew labels. */
export function getAtmCities(): { en: string; he: string }[] {
  const seen = new Map<string, string>()
  for (const a of MOCK_ATMS) if (!seen.has(a.city)) seen.set(a.city, a.cityHe)
  return [...seen].map(([en, he]) => ({ en, he }))
}

export function getAtmBanks(): string[] {
  return [...ATM_BANKS]
}

export function atmCount(): number {
  return MOCK_ATMS.length
}
