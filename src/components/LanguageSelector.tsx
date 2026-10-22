import { useLanguage } from '../i18n/useLanguage'
import { languageNames, type Language } from '../i18n/translations'

/** Short, physically-stable labels for the segmented control. */
const shortLabel: Record<Language, string> = {
  en: 'EN',
  he: 'עב',
}

const options: Language[] = ['en', 'he']

/**
 * Compact EN / עב segmented control. Physically pinned (dir="ltr") so the two
 * segments keep the same order in both languages — only the active state moves.
 */
export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div
      dir="ltr"
      role="group"
      aria-label={t.util.language}
      className="inline-flex items-center rounded-lg bg-surface-2 p-0.5"
    >
      {options.map((lang) => {
        const active = language === lang
        return (
          <button
            key={lang}
            type="button"
            lang={lang}
            onClick={() => setLanguage(lang)}
            aria-pressed={active}
            title={languageNames[lang]}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors motion-reduce:transition-none ${
              active
                ? 'bg-surface text-content shadow-sm'
                : 'text-muted hover:text-content'
            }`}
          >
            <span aria-hidden="true">{shortLabel[lang]}</span>
            <span className="sr-only">{languageNames[lang]}</span>
          </button>
        )
      })}
    </div>
  )
}
