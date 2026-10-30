import type { BankBranch } from '../data/types'
import type { Language } from '../i18n/translations'
import { BANK_BRANCH_RESOURCES } from '../data/services/bankBranchApi'

/**
 * Persistent 30-day cache for the normalized bank-branch dataset, keyed by
 * language.
 *
 * The two language resources are cached INDEPENDENTLY: fetching Hebrew never
 * touches the English cache and vice versa. Each language is stored under its
 * own key in a single IndexedDB object store, so switching languages reuses the
 * other language's cache if it is still valid.
 *
 * IndexedDB (not localStorage) is used because the two datasets together are
 * ~2 MB in localStorage's UTF-16 accounting and would share the ~5 MB
 * per-origin quota with the other datasets' caches. The public shape mirrors
 * the other caches (read / write / isCacheFresh), only async and parameterized
 * by language.
 *
 * Freshness is a pure elapsed-time window of 30 days from the last successful
 * fetch. A cache is also invalidated if the resource id it was written for no
 * longer matches the current resource for that language (resource swap) or the
 * schema version changes. Only validated, successful datasets are ever written
 * — failures never overwrite a good cache.
 */

const SCHEMA_VERSION = 1
// A dedicated database (separate from the antenna cache's `mygovil` DB) so the
// two IndexedDB caches never have to coordinate a shared version number.
const DB_NAME = 'mygovil-bank-branches'
const STORE_NAME = `bank-branch-cache-v${SCHEMA_VERSION}`

/** Cache lifetime: 30 days (720 hours) in milliseconds. */
export const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface BankBranchCache {
  schemaVersion: number
  language: Language
  resourceId: string
  /** Epoch ms of the last successful fetch. */
  fetchedAt: number
  total: number
  branches: BankBranch[]
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
      for (const name of Array.from(db.objectStoreNames)) {
        if (name.startsWith('bank-branch-cache-v') && name !== STORE_NAME) {
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

function isValidCache(v: unknown, language: Language): v is BankBranchCache {
  if (typeof v !== 'object' || v === null) return false
  const c = v as Record<string, unknown>
  return (
    c.schemaVersion === SCHEMA_VERSION &&
    c.language === language &&
    c.resourceId === BANK_BRANCH_RESOURCES[language] &&
    typeof c.fetchedAt === 'number' &&
    typeof c.total === 'number' &&
    Array.isArray(c.branches)
  )
}

/**
 * Read and validate the cache for one language. Resolves to `null` when it is
 * missing, unreadable, malformed, or belongs to a different schema/resource/
 * language. Never rejects — storage being unavailable is handled gracefully.
 */
export async function readBankBranchCache(
  language: Language,
): Promise<BankBranchCache | null> {
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
    const req = tx.objectStore(STORE_NAME).get(language)
    req.onsuccess = () => {
      const value = req.result
      resolve(isValidCache(value, language) ? value : null)
    }
    req.onerror = () => resolve(null)
    tx.oncomplete = () => db.close()
    tx.onabort = () => db.close()
  })
}

/** True when the cache was fetched within the last 30 days. */
export function isCacheFresh(cache: BankBranchCache, now: number = Date.now()): boolean {
  const age = now - cache.fetchedAt
  // Guard against a clock skewed into the future: treat as expired.
  if (age < 0) return false
  return age < CACHE_TTL_MS
}

/**
 * Persist a successful result for one language. Resolves to the written cache
 * (incl. its timestamp), or `null` if storage was unavailable. Only ever called
 * with a validated, successful dataset — failures are never cached, so a good
 * cache is never replaced by a bad one, and the other language is untouched.
 */
export async function writeBankBranchCache(
  language: Language,
  branches: BankBranch[],
  total: number,
): Promise<BankBranchCache | null> {
  const db = await openDb()
  if (!db) return null
  const cache: BankBranchCache = {
    schemaVersion: SCHEMA_VERSION,
    language,
    resourceId: BANK_BRANCH_RESOURCES[language],
    fetchedAt: Date.now(),
    total,
    branches,
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
      tx.objectStore(STORE_NAME).put(cache, language)
    } catch {
      /* resolved via onabort/onerror below */
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
