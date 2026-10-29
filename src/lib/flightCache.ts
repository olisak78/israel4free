import type { Flight } from '../data/types'
import { FLIGHT_RESOURCE_ID } from '../data/services/flightApi'

/**
 * Persistent 1-hour cache for the normalized flight board.
 *
 * React Query / in-memory state does not survive a full page reload, so the
 * board is persisted to localStorage and reused for one hour from the last
 * successful fetch. The serialized dataset (~1,910 compact records) is well
 * under 1 MB, so a single localStorage entry is the simplest reliable choice —
 * no IndexedDB needed and no large JSON duplicated across stores.
 *
 * Freshness is a pure elapsed-time window: the stored `fetchedAt` timestamp is
 * compared against `Date.now()`. Only validated, successful datasets are ever
 * written — failures never overwrite a good cache. A one-hour window keeps the
 * board current enough while avoiding redundant requests; the UI still shows
 * when the data was last fetched so nothing is implied to be real-time.
 */

const SCHEMA_VERSION = 1
// The key embeds the schema version so a schema change invalidates old caches.
const CACHE_KEY = `mygovil:flight-cache:v${SCHEMA_VERSION}`

/** Cache lifetime: 1 hour in milliseconds. */
export const CACHE_TTL_MS = 60 * 60 * 1000

export interface FlightCache {
  schemaVersion: number
  resourceId: string
  /** Epoch ms of the last successful fetch. */
  fetchedAt: number
  total: number
  flights: Flight[]
}

function safeRemove(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* storage unavailable — nothing to do */
  }
}

function isValidCache(v: unknown): v is FlightCache {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    c.schemaVersion === SCHEMA_VERSION &&
    c.resourceId === FLIGHT_RESOURCE_ID &&
    typeof c.fetchedAt === 'number' &&
    typeof c.total === 'number' &&
    Array.isArray(c.flights)
  )
}

/**
 * Read and validate the cache. Returns `null` (and clears the entry) when it is
 * missing, unreadable, malformed, or belongs to a different schema/resource.
 * Never throws — storage being unavailable is handled gracefully.
 */
export function readFlightCache(): FlightCache | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(CACHE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    safeRemove()
    return null
  }

  if (!isValidCache(parsed)) {
    safeRemove()
    return null
  }
  return parsed
}

/** True when the cache was fetched within the last hour. */
export function isCacheFresh(cache: FlightCache, now: number = Date.now()): boolean {
  const age = now - cache.fetchedAt
  // Guard against a clock skewed into the future: treat as expired.
  if (age < 0) return false
  return age < CACHE_TTL_MS
}

/**
 * Persist a successful result. Returns the written cache (incl. its timestamp),
 * or `null` if storage was unavailable (e.g. quota / private mode). Only ever
 * called with a validated, successful dataset — failures are never cached.
 */
export function writeFlightCache(flights: Flight[], total: number): FlightCache | null {
  const cache: FlightCache = {
    schemaVersion: SCHEMA_VERSION,
    resourceId: FLIGHT_RESOURCE_ID,
    fetchedAt: Date.now(),
    total,
    flights,
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return cache
  } catch {
    return null
  }
}
