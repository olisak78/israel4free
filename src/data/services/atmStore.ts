import { useSyncExternalStore } from 'react'
import type { Atm } from '../types'
import { fetchAllAtms, AtmServiceError, type AtmErrorCode } from './atmService'
import {
  readAtmCache,
  writeAtmCache,
  isCacheFreshToday,
  israelDateKey,
} from '../../lib/atmCache'

/**
 * Lightweight external store for the ATM dataset — no React Query dependency.
 *
 * Responsibilities:
 *  - In-memory cache shared across the app (survives client-side navigation and
 *    is safe under StrictMode double-mounting).
 *  - Reads the persistent daily cache on first use; only hits the network when
 *    no cache exists for the current Israel calendar day.
 *  - Background-refreshes stale (previous-day) caches while showing them.
 *  - Keeps a valid older cache visible as a stale fallback when a refresh fails,
 *    rather than overwriting it with an error.
 *  - Adopts a dataset another tab fetched (via the `storage` event), so tabs
 *    don't each refetch when a valid daily cache already exists.
 */

export type AtmStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AtmState {
  status: AtmStatus
  atms: Atm[]
  /** API-reported total (not hardcoded). */
  total: number
  /** Failure code for the UI to localize, or null. */
  error: AtmErrorCode | 'unknown' | null
  /** A background refresh is running while existing data stays visible. */
  isRefreshing: boolean
  /** Showing data from a previous day or a failed refresh. */
  isStale: boolean
  /** Epoch ms of the data currently shown. */
  lastUpdated: number | null
}

let state: AtmState = {
  status: 'idle',
  atms: [],
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

function set(patch: Partial<AtmState>) {
  state = { ...state, ...patch }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  bindStorageListener()
  return () => listeners.delete(listener)
}

function getSnapshot(): AtmState {
  return state
}

/** True when the in-memory data was fetched on the current Israel day. */
function memoryFreshToday(): boolean {
  return (
    state.status === 'success' &&
    !state.isStale &&
    state.lastUpdated !== null &&
    israelDateKey(state.lastUpdated) === israelDateKey()
  )
}

function errorCode(e: unknown): AtmErrorCode | 'unknown' {
  if (e instanceof AtmServiceError) return e.code
  return 'unknown'
}

function runFetch(): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  const hadData = state.atms.length > 0

  set({
    status: hadData ? state.status : 'loading',
    isRefreshing: hadData,
    error: null,
  })

  const run = (async () => {
    try {
      const { atms, total } = await fetchAllAtms(signal)
      const written = writeAtmCache(atms, total)
      set({
        status: 'success',
        atms,
        total,
        error: null,
        isRefreshing: false,
        isStale: false,
        lastUpdated: written?.fetchedAt ?? Date.now(),
      })
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
      const code = errorCode(e)
      if (state.atms.length > 0) {
        // Preserve the valid existing cache as a stale fallback.
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
 * Ensure the dataset is loaded. Call on mount. Resolves from the daily cache
 * without a network request whenever possible.
 */
export function initAtms(): void {
  if (inFlight) return
  if (memoryFreshToday()) return

  if (state.status === 'idle') {
    const cache = readAtmCache()
    if (cache) {
      if (isCacheFreshToday(cache)) {
        set({
          status: 'success',
          atms: cache.atms,
          total: cache.total,
          isStale: false,
          isRefreshing: false,
          lastUpdated: cache.fetchedAt,
          error: null,
        })
        return
      }
      // Previous-day cache: show immediately, refresh quietly in the background.
      set({
        status: 'success',
        atms: cache.atms,
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
export function retryAtms(): void {
  if (inFlight) return
  void runFetch()
}

/** Adopt a dataset another tab persisted for today, if we lack fresh data. */
function bindStorageListener(): void {
  if (storageBound || typeof window === 'undefined') return
  storageBound = true
  window.addEventListener('storage', () => {
    if (inFlight || memoryFreshToday()) return
    const cache = readAtmCache()
    if (cache && isCacheFreshToday(cache)) {
      controller?.abort()
      set({
        status: 'success',
        atms: cache.atms,
        total: cache.total,
        isStale: false,
        isRefreshing: false,
        lastUpdated: cache.fetchedAt,
        error: null,
      })
    }
  })
}

export function useAtmData(): AtmState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
