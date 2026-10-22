import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/useTheme'
import { useT } from '../i18n/useLanguage'

/**
 * Compact icon button that toggles between light and dark.
 * The icon and accessible label describe the action (the theme it switches TO):
 * a moon in light mode, a sun in dark mode. Styling matches the header's other
 * icon controls so it sits naturally beside the language selector.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const t = useT()

  const isDark = theme === 'dark'
  const label = isDark ? t.util.toLight : t.util.toDark

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-content motion-reduce:transition-none"
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  )
}
