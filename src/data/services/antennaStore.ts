import { useSyncExternalStore } from 'react'
import type { CellAntenna } from '../types'
import {
  fetchAllAntennas,
  AntennaServiceError,
  type AntennaErrorCode,
} from './antennaApi'
import {
  readAntennaCache,
  writeAntennaCache,
  isCacheFresh,
} from '../../lib/antennaCache'

/**
 * Lightweight external store for the cellular-antenna dataset — no React Query
 * dependency, matching the ATM / flight / pharmacy stores' design, but reading
 * from an async IndexedDB cache (the dataset is too large for localStorage).
 *
 * Responsibilities:
 *  - In-memory cache shared across the app (survives client-side navigation and
 *    is safe under StrictMode double-mounting).
 *  - Reads the persistent monthly IndexedDB cache on first use; only hits the
 *    network when no cache exists for the current Israel calendar month — so
 *    revisiting within the same month, including across full page reloads,
 *    makes no request.
 *  - Background-refreshes a previous-month cache while still showing it.
 *  - Keeps a valid cache visible as a stale fallback when a refresh fails,
 *    rather than overwriting it with an error or an empty result.
 */

export type AntennaStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AntennaState {
  status: AntennaStatus
  antennas: CellAntenna[]
  /** API-reported total (not hardcoded). */
  total: number
  /** Failure code for the UI to localize, or null. */
  error: AntennaErrorCode | 'unknown' | null
  /** A background refresh is running while existing data stays visible. */
  isRefreshing: boolean
  /** Showing expired data, or data kept after a failed refresh. */
  isStale: boolean
  /** Epoch ms of the data currently shown. */
  lastUpdated: number | null
}

let state: AntennaState = {
  status: 'idle',
  antennas: [],
  total: 0,
  error: null,
  isRefreshing: false,
  isStale: false,
  lastUpdated: null,
}

const listeners = new Set<() => void>()
let controller: AbortController | null = null
let inFlight: Promise<void> | null = null
let initStarted = false

function emit() {
  for (const l of listeners) l()
}

function set(patch: Partial<AntennaState>) {
  state = { ...state, ...patch }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): AntennaState {
  return state
}

function errorCode(e: unknown): AntennaErrorCode | 'unknown' {
  if (e instanceof AntennaServiceError) return e.code
  return 'unknown'
}

function runFetch(): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  const hadData = state.antennas.length > 0

  set({
    status: hadData ? state.status : 'loading',
    isRefreshing: hadData,
    error: null,
  })

  const run = (async () => {
    try {
      const { antennas, total } = await fetchAllAntennas(signal)
      const written = await writeAntennaCache(antennas, total)
      set({
        status: 'success',
        antennas,
        total,
        error: null,
        isRefreshing: false,
        isStale: false,
        lastUpdated: written?.fetchedAt ?? Date.now(),
      })
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
      const code = errorCode(e)
      if (state.antennas.length > 0) {
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
 * Ensure the dataset is loaded. Call on mount. Resolves from the monthly
 * IndexedDB cache without a network request whenever possible. The cache read
 * is async, so the page stays in its loading state until the cache resolves.
 */
export function initAntennas(): void {
  if (initStarted) return
  initStarted = true

  // Reflect that we are working, so the page shows a loading state rather than
  // a misleading empty one while the async cache read is in flight.
  if (state.status === 'idle') set({ status: 'loading' })

  void (async () => {
    let cache = null
    try {
      cache = await readAntennaCache()
    } catch {
      cache = null
    }

    if (cache) {
      if (isCacheFresh(cache)) {
        set({
          status: 'success',
          antennas: cache.antennas,
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
        antennas: cache.antennas,
        total: cache.total,
        isStale: true,
        lastUpdated: cache.fetchedAt,
      })
      void runFetch()
      return
    }

    void runFetch()
  })()
}

/** Manual retry — always attempts a fresh fetch. */
export function retryAntennas(): void {
  if (inFlight) return
  void runFetch()
}

export function useAntennaData(): AntennaState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
