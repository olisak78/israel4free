import { useSyncExternalStore } from 'react'
import type { BankBranch } from '../types'
import type { Language } from '../../i18n/translations'
import {
  fetchAllBankBranches,
  BankBranchServiceError,
  type BankBranchErrorCode,
} from './bankBranchApi'
import {
  readBankBranchCache,
  writeBankBranchCache,
  isCacheFresh,
} from '../../lib/bankBranchCache'

/**
 * Lightweight external store for the bank-branch dataset — no React Query
 * dependency, matching the ATM / flight / antenna stores' design, but holding
 * an INDEPENDENT slot per language (Hebrew and English are distinct resources).
 *
 * Each language has its own state, in-flight request, abort controller, and
 * init guard, so loading one never disturbs the other. `useBankBranchData(lang)`
 * returns the slice for the active language; when the UI language changes the
 * page re-inits that language, which resolves from its own 30-day IndexedDB
 * cache without a network request whenever possible.
 */

export type BankBranchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface BankBranchState {
  status: BankBranchStatus
  branches: BankBranch[]
  /** API-reported total (not hardcoded). */
  total: number
  error: BankBranchErrorCode | 'unknown' | null
  isRefreshing: boolean
  isStale: boolean
  lastUpdated: number | null
}

function initialState(): BankBranchState {
  return {
    status: 'idle',
    branches: [],
    total: 0,
    error: null,
    isRefreshing: false,
    isStale: false,
    lastUpdated: null,
  }
}

const states: Record<Language, BankBranchState> = {
  he: initialState(),
  en: initialState(),
}
const controllers: Record<Language, AbortController | null> = { he: null, en: null }
const inFlight: Record<Language, Promise<void> | null> = { he: null, en: null }
const initStarted: Record<Language, boolean> = { he: false, en: false }

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function set(language: Language, patch: Partial<BankBranchState>) {
  states[language] = { ...states[language], ...patch }
  emit()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function errorCode(e: unknown): BankBranchErrorCode | 'unknown' {
  if (e instanceof BankBranchServiceError) return e.code
  return 'unknown'
}

function runFetch(language: Language): Promise<void> {
  controllers[language]?.abort()
  const controller = new AbortController()
  controllers[language] = controller
  const signal = controller.signal
  const hadData = states[language].branches.length > 0

  set(language, {
    status: hadData ? states[language].status : 'loading',
    isRefreshing: hadData,
    error: null,
  })

  const run = (async () => {
    try {
      const { branches, total } = await fetchAllBankBranches(language, signal)
      const written = await writeBankBranchCache(language, branches, total)
      set(language, {
        status: 'success',
        branches,
        total,
        error: null,
        isRefreshing: false,
        isStale: false,
        lastUpdated: written?.fetchedAt ?? Date.now(),
      })
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return
      const code = errorCode(e)
      if (states[language].branches.length > 0) {
        // Preserve the valid existing data as a stale fallback.
        set(language, { isRefreshing: false, isStale: true, error: code })
      } else {
        set(language, { status: 'error', isRefreshing: false, error: code })
      }
    } finally {
      inFlight[language] = null
    }
  })()

  inFlight[language] = run
  return run
}

/**
 * Ensure the dataset for one language is loaded. Call on mount and whenever the
 * UI language changes. Resolves from that language's 30-day IndexedDB cache
 * without a network request whenever possible; the async cache read keeps the
 * page in a loading state until it resolves.
 */
export function initBankBranches(language: Language): void {
  if (initStarted[language]) return
  initStarted[language] = true

  if (states[language].status === 'idle') set(language, { status: 'loading' })

  void (async () => {
    let cache = null
    try {
      cache = await readBankBranchCache(language)
    } catch {
      cache = null
    }

    if (cache) {
      if (isCacheFresh(cache)) {
        set(language, {
          status: 'success',
          branches: cache.branches,
          total: cache.total,
          isStale: false,
          isRefreshing: false,
          lastUpdated: cache.fetchedAt,
          error: null,
        })
        return
      }
      // Expired cache: show immediately, refresh quietly in the background.
      set(language, {
        status: 'success',
        branches: cache.branches,
        total: cache.total,
        isStale: true,
        lastUpdated: cache.fetchedAt,
      })
      void runFetch(language)
      return
    }

    void runFetch(language)
  })()
}

/** Manual retry for one language — always attempts a fresh fetch. */
export function retryBankBranches(language: Language): void {
  if (inFlight[language]) return
  void runFetch(language)
}

export function useBankBranchData(language: Language): BankBranchState {
  return useSyncExternalStore(
    subscribe,
    () => states[language],
    () => states[language],
  )
}
