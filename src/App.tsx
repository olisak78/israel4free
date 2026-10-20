import { useState } from 'react'
import { Menu, Search } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative w-full max-w-md">
            <label htmlFor="global-search" className="sr-only">
              Search across all datasets
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="global-search"
              type="search"
              placeholder="Search across all datasets…"
              className="w-full rounded-lg bg-gray-100 py-2 pl-9 pr-16 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-400 sm:flex">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-gray-400 sm:inline">
              Open government data
            </span>
            <div
              className="flex h-8 w-8 select-none items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
              aria-hidden="true"
            >
              IL
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <Home />
        </main>
      </div>
    </div>
  )
}

export default App
