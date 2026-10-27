import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Car,
  Home as HomeIcon,
  MapPin,
  Menu,
  Radio,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import logoLight from '../images/main-logo.png'
import logoDark from '../images/dark-logo.png'
import { useLanguage } from '../i18n/useLanguage'
import { useTheme } from '../theme/useTheme'
import { datasets, type CategoryId } from '../data/datasets'
import LanguageSelector from './LanguageSelector'
import ThemeToggle from './ThemeToggle'

interface NavItem {
  /** Destination route. Category items land on Home with a `?c=` filter. */
  to: string
  /** Category this item represents, for active-state matching. */
  category: CategoryId | 'all'
  icon: LucideIcon
  label: string
}

export default function Header() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Light mode shows the full-color lockup; dark mode swaps to the
  // dark-optimized asset. The initial render already reflects the persisted
  // theme, so the correct logo shows with no flash on load or after a toggle.
  const logo = theme === 'dark' ? logoDark : logoLight

  const navItems: NavItem[] = [
    { to: '/', category: 'all', icon: HomeIcon, label: t.nav.home },
    { to: '/?c=transport', category: 'transport', icon: Car, label: t.nav.transport },
    { to: '/?c=locations', category: 'locations', icon: MapPin, label: t.nav.locations },
    { to: '/?c=infrastructure', category: 'infrastructure', icon: Radio, label: t.nav.infrastructure },
  ]

  // Which nav item should read as active. On a dataset page, highlight the
  // category that page belongs to; on Home, highlight the active `?c=` filter
  // (or "Home" when unfiltered).
  const activeCategory: CategoryId | 'all' = (() => {
    const onDatasetPage = datasets.find((d) => d.path === location.pathname)
    if (onDatasetPage) return onDatasetPage.category
    if (location.pathname === '/') {
      const c = new URLSearchParams(location.search).get('c')
      if (c === 'transport' || c === 'locations' || c === 'infrastructure') return c
      return 'all'
    }
    return 'all' // unknown route (404) — nothing active
  })()

  const isActive = (item: NavItem) =>
    location.pathname === '/' || datasets.some((d) => d.path === location.pathname)
      ? item.category === activeCategory
      : false

  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* Row 1 — global header. dir="ltr" pins the physical zones: brand stays
          on the left and utilities on the right in every language. */}
      <div
        dir="ltr"
        className="mx-auto flex h-28 max-w-6xl items-center gap-3 px-4 sm:px-6"
      >
        {/* Brand — physical start, nudged toward center. Links home. The logo
            image is a full lockup (icon + wordmark + tagline). */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          aria-label={t.brand.name}
          className="flex shrink-0 items-center rounded-lg ms-4 sm:ms-10 lg:ms-20"
        >
          <img src={logo} alt={t.brand.name} className="h-24 w-auto" />
        </Link>

        {/* Primary navigation — centered in the row. Desktop only; mobile uses
            the collapsible panel below. */}
        <nav
          aria-label={t.nav.label}
          className="hidden min-w-0 flex-1 justify-center md:flex"
        >
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item)
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors motion-reduce:transition-none ${
                      active
                        ? 'bg-brand-soft text-brand-soft-fg'
                        : 'text-muted hover:bg-surface-2 hover:text-content'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Utilities — physical end */}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <button
            type="button"
            aria-label={t.util.settings}
            title={t.util.settings}
            className="hidden rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-content md:inline-flex"
          >
            <Settings className="h-5 w-5" />
          </button>
          {/* Mobile nav trigger — consistent physical position (always here) */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-content md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel — collapsible disclosure */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label={t.nav.label}
          className="border-t border-edge px-3 py-3 md:hidden"
        >
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item)
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none ${
                      active
                        ? 'bg-brand-soft text-brand-soft-fg'
                        : 'text-muted hover:bg-surface-2 hover:text-content'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li className="mt-1 border-t border-edge pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-content motion-reduce:transition-none"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t.util.settings}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
