import { useSyncExternalStore } from 'react'
import type { Pharmacy } from '../types'
import {
  fetchAllPharmacies,
  PharmacyServiceError,
  type PharmacyErrorCode,
} from './pharmacyApi'
import {
  readPharmacyCache,
  writePharmacyCache,
  isCacheFresh,
} from '../../lib/pharmacyCache'

/**
 * Lightweight external store for the pharmacy dataset — no React Query dependency,
 * matching the ATM store's design.
 *
 * Responsibilities:
 *  - In-memory cache shared across the app (survives client-side navigation and
 *    is safe under StrictMode double-mounting).
 *  - Reads the persistent 72-hour cache on first use; only hits the network when
 *    no fresh cache exists.
 *  - Background-refreshes an expired cache while still showing it.
 *  - Keeps a valid cache visible as a stale fallback when a refresh fails, rather
 *    than overwriting it with an error or an empty result.
 *  - Adopts a dataset another tab fetched (via the `storage` event), so tabs
 *    don't each refetch when a valid cache already exists.
 */

export type PharmacyStatus = 'idle' | 'loading' | 'success' | 'error'

export interface PharmacyState {
  status: PharmacyStatus
  pharmacies: Pharmacy[]
  /** API-reported total (not hardcoded). */
  total: number
  /** Failure code for the UI to localize, or null. */
  error: PharmacyErrorCode | 'unknown' | null
  /** A background refresh is running while existing data stays visible. */
  isRefreshing: boolean
  /** Showing expired data, or data kept after a failed refresh. */
  isStale: boolean
  /** Epoch ms of the data currently shown. */
  lastUpdated: number | null
}

let state: PharmacyState = {
  status: 'idle',
  pharmacies: [],
  total: 0,
  error: null,
  isRefreshing: false,
  isStale: false,
  lastUpdated: null,
}

const listeners = new Set<() => void>()
let controller: AbortController | null = null
let inFlight: Promise<void> | null = null
let storageBound = false

function emit() {
  for (const l of listeners) l()
}

function set(patch: Partial<PharmacyState>) {
  state = { ...state, ...patch }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  bindStorageListener()
  return () => listeners.delete(listener)
}

function getSnapshot(): PharmacyState {
  return state
}

/** True when the in-memory data is still within the 72-hour window. */
function memoryFresh(): boolean {
  return (
    state.status === 'success' &&
    !state.isStale &&
    state.lastUpdated !== null &&
    isCacheFresh({
      schemaVersion: 0,
      resourceId: '',
      fetchedAt: state.lastUpdated,
      total: state.total,
      pharmacies: state.pharmacies,
    })
  )
}

function errorCode(e: unknown): PharmacyErrorCode | 'unknown' {
  if (e instanceof PharmacyServiceError) return e.code
  return 'unknown'
}

function runFetch(): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  const hadData = state.pharmacies.length > 0

  set({
    status: hadData ? state.status : 'loading',
    isRefreshing: hadData,
    error: null,
  })

  const run = (async () => {
    try {
      const { pharmacies, total } = await fetchAllPharmacies(signal)
      const written = writePharmacyCache(pharmacies, total)
      set({
        status: 'success',
        pharmacies,
        total,
        error: null,
        isRefreshing: false,
        isStale: false,
        lastUpdated: written?.fetchedAt ?? Date.now(),
      })
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
      const code = errorCode(e)
      if (state.pharmacies.length > 0) {
        // Preserve the valid existing data as a stale fallback.
        set({ isRefreshing: false, isStale: true, error: code })
      } else {
        set({ status: 'error', isRefreshing: false, error: code })
      }
    } finally {
      inFlight = null
    }
  })()

  inFlight = run
  return run
}

/**
 * Ensure the dataset is loaded. Call on mount. Resolves from the 72-hour cache
 * without a network request whenever possible.
 */
export function initPharmacies(): void {
  if (inFlight) return
  if (memoryFresh()) return

  if (state.status === 'idle') {
    const cache = readPharmacyCache()
    if (cache) {
      if (isCacheFresh(cache)) {
        set({
          status: 'success',
          pharmacies: cache.pharmacies,
          total: cache.total,
          isStale: false,
          isRefreshing: false,
          lastUpdated: cache.fetchedAt,
          error: null,
        })
        return
      }
      // Expired cache: show immediately, refresh quietly in the background.
      set({
        status: 'success',
        pharmacies: cache.pharmacies,
        total: cache.total,
        isStale: true,
        lastUpdated: cache.fetchedAt,
      })
      void runFetch()
      return
    }
  }

  void runFetch()
}

/** Manual retry — always attempts a fresh fetch. */
export function retryPharmacies(): void {
  if (inFlight) return
  void runFetch()
}

/** Adopt a dataset another tab persisted, if we lack fresh data. */
function bindStorageListener(): void {
  if (storageBound || typeof window === 'undefined') return
  storageBound = true
  window.addEventListener('storage', () => {
    if (inFlight || memoryFresh()) return
    const cache = readPharmacyCache()
    if (cache && isCacheFresh(cache)) {
      controller?.abort()
      set({
        status: 'success',
        pharmacies: cache.pharmacies,
        total: cache.total,
        isStale: false,
        isRefreshing: false,
        lastUpdated: cache.fetchedAt,
        error: null,
      })
    }
  })
}

export function usePharmacyData(): PharmacyState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
