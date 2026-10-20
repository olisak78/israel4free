import { LayoutDashboard, Database, Settings, Info, X } from 'lucide-react'
import { datasets } from '../data/datasets'

interface SidebarProps {
  /** Mobile drawer open state (ignored on desktop, where the sidebar is static) */
  mobileOpen: boolean
  onClose: () => void
}

const activeId = 'home'

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: 'Home' },
    ...datasets.map((d) => ({ id: d.id, icon: d.icon, label: d.title })),
  ]

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col bg-slate-900 transition-transform duration-200 ease-out motion-reduce:transition-none lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500">
              <Database className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-bold leading-none text-white">
                Israel4Free
              </div>
              <div className="mt-1 text-xs text-slate-400">Data Portal</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dataset navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Datasets
          </p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = item.id === activeId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors motion-reduce:transition-none ${
                      active
                        ? 'bg-blue-600 font-medium text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
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

        {/* Utility group */}
        <div className="shrink-0 border-t border-white/5 px-3 py-4">
          <ul className="space-y-0.5">
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 motion-reduce:transition-none"
              >
                <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                Settings
              </button>
            </li>
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 motion-reduce:transition-none"
              >
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                About
              </button>
            </li>
          </ul>
          <p className="px-3 pt-3 text-xs text-slate-600">
            Source: data.gov.il · Open Source
          </p>
        </div>
      </aside>
    </>
  )
}
