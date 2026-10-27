import type { AntennaStatus, CellAntenna, CellTechnology } from '../types'
import { ANTENNA_OPERATORS, MOCK_ANTENNAS } from '../mock/mockCellAntennas'

/**
 * Cellular-infrastructure service — the seam a real data.gov.il antenna
 * resource would replace. Technical values (mast height, band) are illustrative
 * and labeled as such in the UI. No radiation, exposure, or safety data is
 * represented or implied.
 */

export interface AntennaQuery {
  search?: string
  city?: string
  operator?: string
  technology?: CellTechnology | 'all'
  status?: AntennaStatus | 'all'
}

export function queryAntennas(q: AntennaQuery = {}): CellAntenna[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  return MOCK_ANTENNAS.filter((a) => {
    if (q.city && a.city !== q.city) return false
    if (q.operator && a.operator !== q.operator) return false
    if (q.technology && q.technology !== 'all' && a.technology !== q.technology) return false
    if (q.status && q.status !== 'all' && a.status !== q.status) return false
    if (!search) return true
    return (
      a.id.toLowerCase().includes(search) ||
      a.operator.toLowerCase().includes(search) ||
      a.operatorHe.includes(search) ||
      a.city.toLowerCase().includes(search) ||
      a.cityHe.includes(search) ||
      a.address.toLowerCase().includes(search) ||
      a.addressHe.includes(search)
    )
  })
}

export function getAntennaCities(): { en: string; he: string }[] {
  const seen = new Map<string, string>()
  for (const a of MOCK_ANTENNAS) if (!seen.has(a.city)) seen.set(a.city, a.cityHe)
  return [...seen].map(([en, he]) => ({ en, he }))
}

export function getAntennaOperators(): string[] {
  return [...ANTENNA_OPERATORS]
}

/** Aggregate metrics for the summary strip. */
export function antennaSummary() {
  const operators = new Set(MOCK_ANTENNAS.map((a) => a.operator))
  const cities = new Set(MOCK_ANTENNAS.map((a) => a.city))
  const fiveG = MOCK_ANTENNAS.filter((a) => a.technology === '5G').length
  return {
    total: MOCK_ANTENNAS.length,
    operators: operators.size,
    cities: cities.size,
    fiveG,
  }
}
