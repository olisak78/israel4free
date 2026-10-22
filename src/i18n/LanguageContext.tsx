import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { dictionaries, direction, type Language } from './translations'
import { LanguageContext, type LanguageContextValue } from './useLanguage'

const STORAGE_KEY = 'i4f.language'

function readInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'he') return stored
  // Fall back to the browser preference, defaulting to English otherwise.
  return window.navigator.language?.startsWith('he') ? 'he' : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage)

  // Keep the document's language and direction in sync. This is the ONLY place
  // that touches `dir` on the document — text flow derives from here, while the
  // application shell pins its physical layout independently (see Header/App).
  useEffect(() => {
    const root = document.documentElement
    root.lang = language
    root.dir = direction[language]
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      dir: direction[language],
      setLanguage,
      t: dictionaries[language],
    }),
    [language, setLanguage],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
