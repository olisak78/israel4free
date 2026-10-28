import type { Atm } from '../data/types'
import { ATM_RESOURCE_ID } from '../data/services/atmService'

/**
 * Persistent daily cache for the normalized ATM dataset.
 *
 * React Query / in-memory state does not survive a full page reload, so the
 * dataset is persisted to localStorage and reused for the rest of the Israel
 * calendar day. The serialized normalized dataset is well under 1 MB (~2,959
 * compact records), comfortably within localStorage limits, so a single
 * localStorage entry is the simplest reliable choice — no IndexedDB needed and
 * no large JSON duplicated across stores.
 *
 * The daily boundary uses Israel's local calendar date (Asia/Jerusalem) via
 * Intl, avoiding ambiguous date-string/UTC comparisons.
 */

const SCHEMA_VERSION = 1
// The key embeds the schema version so a schema change invalidates old caches.
const CACHE_KEY = `mygovil:atm-cache:v${SCHEMA_VERSION}`

export interface AtmCache {
  schemaVersion: number
  resourceId: string
  /** Epoch ms of the last successful fetch. */
  fetchedAt: number
  /** Israel calendar date (YYYY-MM-DD) of the last successful fetch. */
  dateKey: string
  total: number
  atms: Atm[]
}

/** Israel-local calendar date as 'YYYY-MM-DD' (en-CA yields ISO order). */
export function israelDateKey(epoch: number = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(epoch))
}

function safeRemove(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* storage unavailable — nothing to do */
  }
}

function isValidCache(v: unknown): v is AtmCache {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    c.schemaVersion === SCHEMA_VERSION &&
    c.resourceId === ATM_RESOURCE_ID &&
    typeof c.fetchedAt === 'number' &&
    typeof c.dateKey === 'string' &&
    typeof c.total === 'number' &&
    Array.isArray(c.atms)
  )
}

/**
 * Read and validate the cache. Returns `null` (and clears the entry) when it is
 * missing, unreadable, malformed, or belongs to a different schema/resource.
 * Never throws — storage being unavailable is handled gracefully.
 */
export function readAtmCache(): AtmCache | null {
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

/** True when the cache was last fetched on the current Israel calendar day. */
export function isCacheFreshToday(cache: AtmCache): boolean {
  return cache.dateKey === israelDateKey()
}

/**
 * Persist a successful result. Returns the written cache (incl. its timestamp),
 * or `null` if storage was unavailable (e.g. quota / private mode). Only ever
 * called with a validated, successful dataset — failures are never cached.
 */
export function writeAtmCache(atms: Atm[], total: number): AtmCache | null {
  const fetchedAt = Date.now()
  const cache: AtmCache = {
    schemaVersion: SCHEMA_VERSION,
    resourceId: ATM_RESOURCE_ID,
    fetchedAt,
    dateKey: israelDateKey(fetchedAt),
    total,
    atms,
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return cache
  } catch {
    return null
  }
}
