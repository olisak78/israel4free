import type { Flight, FlightDirection, FlightStatus } from '../types'
import { AIRPORTS, MOCK_FLIGHTS } from '../mock/mockFlights'

/**
 * Flight board service — the seam a real airport/flights resource would
 * replace. All filtering and sorting of the board happens here so the page
 * stays declarative. Nothing here is live: times are illustrative.
 */

export { AIRPORTS }

export interface FlightQuery {
  airport: string
  direction: FlightDirection
  /** Free text over flight number, airline, and counterpart city. */
  search?: string
  /** Status filter, or 'all'. */
  status?: FlightStatus | 'all'
  /** Sort by scheduled time. */
  sort?: 'asc' | 'desc'
}

export function queryFlights(q: FlightQuery): Flight[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  const rows = MOCK_FLIGHTS.filter((f) => {
    if (f.airport !== q.airport) return false
    if (f.direction !== q.direction) return false
    if (q.status && q.status !== 'all' && f.status !== q.status) return false
    if (!search) return true
    return (
      f.flightNumber.toLowerCase().includes(search) ||
      f.airline.toLowerCase().includes(search) ||
      f.airlineHe.includes(search) ||
      f.counterpartCity.toLowerCase().includes(search) ||
      f.counterpartCityHe.includes(search) ||
      f.counterpartCode.toLowerCase().includes(search)
    )
  })
  const dir = q.sort === 'desc' ? -1 : 1
  return rows.sort((a, b) => a.scheduled.localeCompare(b.scheduled) * dir)
}

/** Board summary counts for an airport (both directions combined). */
export function flightSummary(airport: string) {
  const all = MOCK_FLIGHTS.filter((f) => f.airport === airport)
  return {
    total: all.length,
    departures: all.filter((f) => f.direction === 'departure').length,
    arrivals: all.filter((f) => f.direction === 'arrival').length,
    delayed: all.filter((f) => f.status === 'delayed' || f.status === 'cancelled').length,
  }
}

/** Count per direction, for the tab badges. */
export function directionCount(airport: string, direction: FlightDirection): number {
  return MOCK_FLIGHTS.filter((f) => f.airport === airport && f.direction === direction).length
}
