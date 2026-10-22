import { createContext, useContext } from 'react'
import { type Dict, type Language } from './translations'

export interface LanguageContextValue {
  language: Language
  /** 'ltr' | 'rtl' for the active language — for the few components that need it. */
  dir: 'ltr' | 'rtl'
  setLanguage: (lang: Language) => void
  /** The active language's string dictionary. */
  t: Dict
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

/** Access the active language, its direction, and the setter. */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return ctx
}

/** Shorthand for the active language's string dictionary. */
export function useT(): Dict {
  return useLanguage().t
}
