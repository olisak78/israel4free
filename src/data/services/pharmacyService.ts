import type { Pharmacy } from '../types'
import { MOCK_PHARMACIES, PHARMACY_CHAINS } from '../mock/mockPharmacies'

/**
 * Pharmacy finder service — the seam a real data.gov.il pharmacy resource would
 * replace. Opening hours here are illustrative; the page labels them as sample
 * data and never claims they are verified.
 */

export interface PharmacyQuery {
  search?: string
  city?: string
  chain?: string
  onCallOnly?: boolean
}

export function queryPharmacies(q: PharmacyQuery = {}): Pharmacy[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  return MOCK_PHARMACIES.filter((p) => {
    if (q.city && p.city !== q.city) return false
    if (q.chain && p.chain !== q.chain) return false
    if (q.onCallOnly && !p.onCall) return false
    if (!search) return true
    return (
      p.name.toLowerCase().includes(search) ||
      p.nameHe.includes(search) ||
      p.address.toLowerCase().includes(search) ||
      p.addressHe.includes(search) ||
      p.city.toLowerCase().includes(search) ||
      p.cityHe.includes(search)
    )
  })
}

export function getPharmacyCities(): { en: string; he: string }[] {
  const seen = new Map<string, string>()
  for (const p of MOCK_PHARMACIES) if (!seen.has(p.city)) seen.set(p.city, p.cityHe)
  return [...seen].map(([en, he]) => ({ en, he }))
}

export function getPharmacyChains(): string[] {
  return [...PHARMACY_CHAINS]
}

export function pharmacyCount(): number {
  return MOCK_PHARMACIES.length
}

/**
 * Whether a pharmacy is open at the given moment, derived from its illustrative
 * weekly hours. "24:00" is treated as end-of-day. Returns null when that day is
 * closed. The caller presents this as a derived indicator over sample hours,
 * not a verified live status.
 */
export function isOpenAt(p: Pharmacy, when: Date): boolean {
  const day = when.getDay() // 0 = Sunday
  const slot = p.hours[day]
  if (!slot) return false
  const minutes = when.getHours() * 60 + when.getMinutes()
  const [oh, om] = slot.open.split(':').map(Number)
  const [ch, cm] = slot.close.split(':').map(Number)
  return minutes >= oh * 60 + om && minutes < ch * 60 + cm
}
