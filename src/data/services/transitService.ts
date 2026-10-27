import type { TransitRoute, TransitStop } from '../types'
import {
  MOCK_ROUTES,
  MOCK_STOPS,
  TRANSIT_ROUTE_NUMBERS,
} from '../mock/mockTransit'

/**
 * Public-transit service — the seam a real GTFS / data.gov.il transit resource
 * would replace. Nothing here is a live schedule; `frequencyMin` is an
 * illustrative headway, not real-time arrival data.
 */

export interface StopQuery {
  search?: string
  city?: string
  route?: string
}

export function queryStops(q: StopQuery = {}): TransitStop[] {
  const search = q.search?.trim().toLowerCase() ?? ''
  return MOCK_STOPS.filter((s) => {
    if (q.city && s.city !== q.city) return false
    if (q.route && !s.routes.includes(q.route)) return false
    if (!search) return true
    return (
      s.name.toLowerCase().includes(search) ||
      s.nameHe.includes(search) ||
      s.id.includes(search) ||
      s.city.toLowerCase().includes(search) ||
      s.cityHe.includes(search)
    )
  })
}

export function queryRoutes(search = ''): TransitRoute[] {
  const q = search.trim().toLowerCase()
  if (!q) return MOCK_ROUTES
  return MOCK_ROUTES.filter(
    (r) =>
      r.number.toLowerCase().includes(q) ||
      r.operator.toLowerCase().includes(q) ||
      r.operatorHe.includes(q) ||
      r.origin.toLowerCase().includes(q) ||
      r.destination.toLowerCase().includes(q) ||
      r.originHe.includes(q) ||
      r.destinationHe.includes(q),
  )
}

export function getRoute(id: string): TransitRoute | undefined {
  return MOCK_ROUTES.find((r) => r.id === id)
}

export function getStopCities(): { en: string; he: string }[] {
  const seen = new Map<string, string>()
  for (const s of MOCK_STOPS) if (!seen.has(s.city)) seen.set(s.city, s.cityHe)
  return [...seen].map(([en, he]) => ({ en, he }))
}

export function getRouteNumbers(): string[] {
  return [...TRANSIT_ROUTE_NUMBERS]
}

export const transitCounts = {
  stops: MOCK_STOPS.length,
  routes: MOCK_ROUTES.length,
}
