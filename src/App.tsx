import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './theme/ThemeContext'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import CarLicenses from './pages/CarLicenses'
import Flights from './pages/Flights'
import AtmLocations from './pages/AtmLocations'
import CellAntennas from './pages/CellAntennas'
import PublicTransit from './pages/PublicTransit'
import Pharmacies from './pages/Pharmacies'
import Organization from './pages/Organization'
import NotFound from './pages/NotFound'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          {/* Return scroll to the top of the document on every route change, so a
              new page never opens scrolled down from the previous one. */}
          <ScrollToTop />

          {/* Direction-neutral application shell: a full-width header on top and a
              centered content area below. No permanent side navigation, so nothing
              relocates when the language direction flips. The shell is identical on
              every route; only the routed content below changes. */}
          <div className="flex min-h-screen flex-col bg-page">
            <Header />

            <main id="main" className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/car-licenses" element={<CarLicenses />} />
                <Route path="/flights" element={<Flights />} />
                <Route path="/atm-locations" element={<AtmLocations />} />
                <Route path="/cell-antennas" element={<CellAntennas />} />
                <Route path="/public-transit" element={<PublicTransit />} />
                <Route path="/pharmacies" element={<Pharmacies />} />
                <Route
                  path="/organizations/:organizationSlug"
                  element={<Organization />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
