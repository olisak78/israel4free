import { useSyncExternalStore } from 'react'
import type { Flight } from '../types'
import {
  fetchAllFlights,
  FlightServiceError,
  type FlightErrorCode,
} from './flightApi'
import { readFlightCache, writeFlightCache, isCacheFresh } from '../../lib/flightCache'

/**
 * Lightweight external store for the flight board — no React Query dependency,
 * matching the ATM and pharmacy stores' design.
 *
 * Responsibilities:
 *  - In-memory cache shared across the app (survives client-side navigation and
 *    is safe under StrictMode double-mounting).
 *  - Reads the persistent 1-hour cache on first use; only hits the network when
 *    no fresh cache exists — so revisiting within the hour makes no request.
 *  - Background-refreshes an expired cache while still showing it.
 *  - Keeps a valid cache visible as a stale fallback when a refresh fails, rather
 *    than overwriting it with an error or an empty result.
 *  - Adopts a dataset another tab fetched (via the `storage` event), so tabs
 *    don't each refetch when a valid cache already exists.
 */

export type FlightStatus = 'idle' | 'loading' | 'success' | 'error'

export interface FlightState {
  status: FlightStatus
  flights: Flight[]
  /** API-reported total (not hardcoded). */
  total: number
  /** Failure code for the UI to localize, or null. */
  error: FlightErrorCode | 'unknown' | null
  /** A background refresh is running while existing data stays visible. */
  isRefreshing: boolean
  /** Showing expired data, or data kept after a failed refresh. */
  isStale: boolean
  /** Epoch ms of the data currently shown. */
  lastUpdated: number | null
}

let state: FlightState = {
  status: 'idle',
  flights: [],
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

function set(patch: Partial<FlightState>) {
  state = { ...state, ...patch }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  bindStorageListener()
  return () => listeners.delete(listener)
}

function getSnapshot(): FlightState {
  return state
}

/** True when the in-memory data is still within the 1-hour window. */
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
      flights: state.flights,
    })
  )
}

function errorCode(e: unknown): FlightErrorCode | 'unknown' {
  if (e instanceof FlightServiceError) return e.code
  return 'unknown'
}

function runFetch(): Promise<void> {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  const hadData = state.flights.length > 0

  set({
    status: hadData ? state.status : 'loading',
    isRefreshing: hadData,
    error: null,
  })

  const run = (async () => {
    try {
      const { flights, total } = await fetchAllFlights(signal)
      const written = writeFlightCache(flights, total)
      set({
        status: 'success',
        flights,
        total,
        error: null,
        isRefreshing: false,
        isStale: false,
        lastUpdated: written?.fetchedAt ?? Date.now(),
      })
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
      const code = errorCode(e)
      if (state.flights.length > 0) {
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
 * Ensure the board is loaded. Call on mount. Resolves from the 1-hour cache
 * without a network request whenever possible.
 */
export function initFlights(): void {
  if (inFlight) return
  if (memoryFresh()) return

  if (state.status === 'idle') {
    const cache = readFlightCache()
    if (cache) {
      if (isCacheFresh(cache)) {
        set({
          status: 'success',
          flights: cache.flights,
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
        flights: cache.flights,
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
export function retryFlights(): void {
  if (inFlight) return
  void runFetch()
}

/** Adopt a dataset another tab persisted, if we lack fresh data. */
function bindStorageListener(): void {
  if (storageBound || typeof window === 'undefined') return
  storageBound = true
  window.addEventListener('storage', () => {
    if (inFlight || memoryFresh()) return
    const cache = readFlightCache()
    if (cache && isCacheFresh(cache)) {
      controller?.abort()
      set({
        status: 'success',
        flights: cache.flights,
        total: cache.total,
        isStale: false,
        isRefreshing: false,
        lastUpdated: cache.fetchedAt,
        error: null,
      })
    }
  })
}

export function useFlightData(): FlightState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
