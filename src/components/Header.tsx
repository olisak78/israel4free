import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Home as HomeIcon,
  Menu,
  Settings,
  Shapes,
  X,
  type LucideIcon,
} from 'lucide-react'
import logoLight from '../images/main-logo.png'
import logoDark from '../images/dark-logo.png'
import { useLanguage } from '../i18n/useLanguage'
import { useTheme } from '../theme/useTheme'
import { scrollToSection } from '../lib/scrollToSection'
import LanguageSelector from './LanguageSelector'
import ThemeToggle from './ThemeToggle'

/** A homepage section the nav scrolls to. `'top'` is the hero. */
type SectionId = 'top' | 'organizations' | 'topics'

interface NavItem {
  /** Section this item targets on the homepage. */
  section: SectionId
  /** Semantic href — enables hover preview, middle-click, and open-in-new-tab. */
  to: string
  icon: LucideIcon
  label: string
}

export default function Header() {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId | ''>('top')

  // Light mode shows the full-color lockup; dark mode swaps to the
  // dark-optimized asset. The initial render already reflects the persisted
  // theme, so the correct logo shows with no flash on load or after a toggle.
  const logo = theme === 'dark' ? logoDark : logoLight

  const onHome = location.pathname === '/'

  const navItems: NavItem[] = [
    { section: 'top', to: '/', icon: HomeIcon, label: t.nav.home },
    {
      section: 'organizations',
      to: '/#organizations',
      icon: Building2,
      label: t.nav.organizations,
    },
    { section: 'topics', to: '/#topics', icon: Shapes, label: t.nav.topics },
  ]

  // Scroll-spy: on the homepage, reflect the section currently in view. The
  // sections stack vertically, so we pick the lowest one whose top has passed
  // below the sticky header. Off the homepage, nothing is active.
  useEffect(() => {
    if (!onHome) {
      setActiveSection('')
      return
    }
    function onScroll() {
      const probe = window.scrollY + 140 // just below the sticky header
      const topOf = (id: string) => {
        const el = document.getElementById(id)
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity
      }
      if (probe >= topOf('topics')) setActiveSection('topics')
      else if (probe >= topOf('organizations')) setActiveSection('organizations')
      else setActiveSection('top')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [onHome])

  function handleNavClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem,
  ) {
    setMenuOpen(false)
    // Let the browser handle modified clicks (new tab / window) via the href.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()

    if (onHome) {
      // Already here — scroll in place (works even on repeat clicks).
      scrollToSection(item.section)
    } else if (item.section === 'top') {
      navigate('/')
    } else {
      // Navigate home, then let Home scroll to the requested section.
      navigate('/', { state: { scrollTo: item.section } })
    }
  }

  const isActive = (item: NavItem) => onHome && activeSection === item.section

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
                <li key={item.section}>
                  <Link
                    to={item.to}
                    onClick={(e) => handleNavClick(e, item)}
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
                <li key={item.section}>
                  <Link
                    to={item.to}
                    onClick={(e) => handleNavClick(e, item)}
                    aria-current={active ? 'page' : undefined}
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
