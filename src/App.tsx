import { useState } from 'react'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './theme/ThemeContext'
import Header from './components/Header'
import Home from './pages/Home'
import type { Filter } from './data/datasets'

function App() {
  // Top-level section / category filter, shared between the header navigation
  // and the Home page so both stay in sync (single source of truth).
  const [filter, setFilter] = useState<Filter>('all')

  return (
    <ThemeProvider>
      <LanguageProvider>
        {/* Direction-neutral application shell: a centered column with a full-width
            header on top and a centered content area below. No permanent side
            navigation, so nothing relocates when the language direction flips. */}
        <div className="flex min-h-screen flex-col bg-page">
          <Header activeFilter={filter} onSelectFilter={setFilter} />

          <main id="main" className="flex-1">
            <Home filter={filter} onFilterChange={setFilter} />
          </main>
        </div>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
