import { useState } from 'react'
import {
  Car,
  Database,
  Home as HomeIcon,
  MapPin,
  Menu,
  Radio,
  Search,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useLanguage } from '../i18n/useLanguage'
import type { Filter } from '../data/datasets'
import LanguageSelector from './LanguageSelector'

interface HeaderProps {
  /** Active top-level section, shared with the Home page's category filter. */
  activeFilter: Filter
  onSelectFilter: (filter: Filter) => void
}

interface NavItem {
  filter: Filter
  icon: LucideIcon
  label: string
}

export default function Header({ activeFilter, onSelectFilter }: HeaderProps) {
  const { dir, t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems: NavItem[] = [
    { filter: 'all', icon: HomeIcon, label: t.nav.home },
    { filter: 'transport', icon: Car, label: t.nav.transport },
    { filter: 'locations', icon: MapPin, label: t.nav.locations },
    { filter: 'infrastructure', icon: Radio, label: t.nav.infrastructure },
  ]

  function handleSelect(filter: Filter) {
    onSelectFilter(filter)
    setMenuOpen(false)
  }

  /** Search field, reused in the desktop header row and the mobile panel.
   *  Its wrapper follows the active language direction so the icon always sits
   *  on the leading edge and the shortcut hint on the trailing edge. */
  const searchField = (id: string) => (
    <div dir={dir} className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {t.search.label}
      </label>
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        dir="auto"
        placeholder={t.search.placeholder}
        className="w-full rounded-lg bg-gray-100 py-2 pe-16 ps-9 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <kbd className="pointer-events-none absolute end-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-400 sm:flex">
        ⌘K
      </kbd>
    </div>
  )

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Row 1 — global header. dir="ltr" pins the physical zones: brand stays
          on the left and utilities on the right in every language. */}
      <div
        dir="ltr"
        className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6"
      >
        {/* Brand — physical start */}
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault()
            handleSelect('all')
          }}
          className="flex shrink-0 items-center gap-2.5 rounded-lg"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <Database className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-bold text-gray-900">
              {t.brand.name}
            </span>
            <span className="mt-1 hidden text-xs text-gray-400 sm:block">
              {t.brand.tagline}
            </span>
          </span>
        </a>

        {/* Search — grows and centers (desktop only; mobile has its own row) */}
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="w-full max-w-md">{searchField('global-search')}</div>
        </div>

        {/* Utilities — physical end */}
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LanguageSelector />
          <button
            type="button"
            aria-label={t.util.settings}
            title={t.util.settings}
            className="hidden rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:inline-flex"
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
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Row 2 — primary navigation, centered. dir="ltr" keeps the tab order
          physically identical across languages (labels still read correctly). */}
      <nav
        aria-label={t.nav.label}
        dir="ltr"
        className="mx-auto hidden max-w-6xl justify-center px-4 pb-2 md:flex"
      >
        <ul className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.filter === activeFilter
            return (
              <li key={item.filter}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleSelect(item.filter)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors motion-reduce:transition-none ${
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Mobile search — always visible so search is never hidden behind a menu */}
      <div className="px-4 pb-3 md:hidden">{searchField('global-search-mobile')}</div>

      {/* Mobile nav panel — collapsible disclosure */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label={t.nav.label}
          className="border-t border-gray-200 px-3 py-3 md:hidden"
        >
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = item.filter === activeFilter
              return (
                <li key={item.filter}>
                  <button
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    onClick={() => handleSelect(item.filter)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors motion-reduce:transition-none ${
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              )
            })}
            <li className="mt-1 border-t border-gray-100 pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 motion-reduce:transition-none"
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
