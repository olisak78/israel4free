import type { CellAntenna } from '../data/types'
import { ANTENNA_RESOURCE_ID } from '../data/services/antennaApi'

/**
 * Persistent monthly cache for the normalized cellular-antenna dataset.
 *
 * Unlike the ATM / flight / pharmacy caches (which use localStorage), this
 * dataset is large: ~8,500 records serialize to ~6 MB of JSON, which is ~10 MB
 * in localStorage's UTF-16 accounting — past the typical ~5 MB per-origin
 * localStorage quota, and sharing that quota with the other datasets' caches.
 * So this one is persisted in **IndexedDB**, which has a far larger quota and
 * stores the structured value without a second JSON copy. The public shape
 * mirrors the other caches (read / write / isCacheFresh), only async.
 *
 * Freshness is tied to the **Israel calendar month** (Asia/Jerusalem): once the
 * dataset has been fetched in a given month it is reused for the rest of that
 * month, and only refetched when the month rolls over. The registry changes
 * slowly, so a monthly cadence avoids needless refetches of a multi-megabyte
 * dataset. Only validated, successful datasets are ever written — failures
 * never overwrite a good cache. The UI still shows when the data was last
 * fetched so nothing is implied to be real-time.
 */

const SCHEMA_VERSION = 2
const DB_NAME = 'mygovil'
// The store name embeds the schema version so a schema change starts a fresh
// object store (and the old one is dropped on upgrade), invalidating old data.
const STORE_NAME = `antenna-cache-v${SCHEMA_VERSION}`
const RECORD_KEY = 'current'

export interface AntennaCache {
  schemaVersion: number
  resourceId: string
  /** Epoch ms of the last successful fetch (for display). */
  fetchedAt: number
  /** Israel calendar month (YYYY-MM) of the last successful fetch. */
  monthKey: string
  total: number
  antennas: CellAntenna[]
}

/** Israel-local calendar month as 'YYYY-MM' (en-CA yields ISO order). */
export function israelMonthKey(epoch: number = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date(epoch))
}

/** Open the database, creating/upgrading the versioned object store. Never throws. */
function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    let req: IDBOpenDBRequest
    try {
      req = indexedDB.open(DB_NAME, SCHEMA_VERSION)
    } catch {
      resolve(null)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      // Drop any older antenna stores (previous schema versions) and (re)create
      // the current one, so a schema bump never serves stale-shaped data.
      for (const name of Array.from(db.objectStoreNames)) {
        if (name.startsWith('antenna-cache-v') && name !== STORE_NAME) {
          db.deleteObjectStore(name)
        }
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
  })
}

function isValidCache(v: unknown): v is AntennaCache {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    c.schemaVersion === SCHEMA_VERSION &&
    c.resourceId === ANTENNA_RESOURCE_ID &&
    typeof c.fetchedAt === 'number' &&
    typeof c.monthKey === 'string' &&
    typeof c.total === 'number' &&
    Array.isArray(c.antennas)
  )
}

/**
 * Read and validate the cache. Resolves to `null` when it is missing,
 * unreadable, malformed, or belongs to a different schema/resource. Never
 * rejects — storage being unavailable is handled gracefully.
 */
export async function readAntennaCache(): Promise<AntennaCache | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    let tx: IDBTransaction
    try {
      tx = db.transaction(STORE_NAME, 'readonly')
    } catch {
      db.close()
      resolve(null)
      return
    }
    const req = tx.objectStore(STORE_NAME).get(RECORD_KEY)
    req.onsuccess = () => {
      const value = req.result
      resolve(isValidCache(value) ? value : null)
    }
    req.onerror = () => resolve(null)
    tx.oncomplete = () => db.close()
    tx.onabort = () => db.close()
  })
}

/** True when the cache was last fetched in the current Israel calendar month. */
export function isCacheFresh(cache: AntennaCache): boolean {
  return cache.monthKey === israelMonthKey()
}

/**
 * Persist a successful result. Resolves to the written cache (incl. its
 * timestamp), or `null` if storage was unavailable (e.g. private mode / quota).
 * Only ever called with a validated, successful dataset — failures are never
 * cached, so a good cache is never replaced by a bad one.
 */
export async function writeAntennaCache(
  antennas: CellAntenna[],
  total: number,
): Promise<AntennaCache | null> {
  const db = await openDb()
  if (!db) return null
  const fetchedAt = Date.now()
  const cache: AntennaCache = {
    schemaVersion: SCHEMA_VERSION,
    resourceId: ANTENNA_RESOURCE_ID,
    fetchedAt,
    monthKey: israelMonthKey(fetchedAt),
    total,
    antennas,
  }
  return new Promise((resolve) => {
    let tx: IDBTransaction
    try {
      tx = db.transaction(STORE_NAME, 'readwrite')
    } catch {
      db.close()
      resolve(null)
      return
    }
    try {
      tx.objectStore(STORE_NAME).put(cache, RECORD_KEY)
    } catch {
      /* put threw synchronously — resolve null via onabort/oncomplete below */
    }
    tx.oncomplete = () => {
      db.close()
      resolve(cache)
    }
    tx.onerror = () => {
      db.close()
      resolve(null)
    }
    tx.onabort = () => {
      db.close()
      resolve(null)
    }
  })
}
