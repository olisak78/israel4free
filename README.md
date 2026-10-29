# MyGovIL — Israel Open Data Portal

A fast, clean, bilingual (English / Hebrew) interface over Israel's public
government data. MyGovIL turns raw [data.gov.il](https://data.gov.il) datasets
into focused, searchable, mobile-friendly pages — no sign-up, no backend.

> **Independent project.** This is an unofficial, independent front-end built on
> top of Israel's open government data. It is not affiliated with or endorsed by
> any government ministry or authority. Data originates from Israel's official
> open-data platform, data.gov.il.

## Services

The portal is organized around dedicated dataset pages, grouped by the
government organization that publishes each dataset:

| Page | Route | Data source | Highlights |
| --- | --- | --- | --- |
| **Flights** | `/flights` | 🟢 Live (Israel Airports Authority) | Ben Gurion departures/arrivals board, status filtering, search by flight/airline/destination |
| **ATM Locations** | `/atm-locations` | 🟢 Live (Bank of Israel) | Interactive map of ATMs, filter by bank / city / accessibility |
| **Cellular Antennas** | `/cell-antennas` | 🟢 Live (Ministry of Environmental Protection) | Reported transmission sites with permits, inspection dates, and radiation measurements, on an interactive map |
| **Medical Cannabis Pharmacies** | `/pharmacies` | 🟢 Live (Ministry of Health) | Pharmacies authorized for medical-cannabis sales, with directions links |
| **Car Licenses** | `/car-licenses` | ⚪ Sample data | Vehicle lookup by license plate (make, model, year, registration) |
| **Public Transit** | `/public-transit` | ⚪ Sample data | Bus / train / light-rail stops and routes |

🟢 = fetched live from data.gov.il · ⚪ = illustrative sample data, clearly
labelled in the UI as such.

Every page can also be reached through its **publishing organization** page
(`/organizations/:slug`) or the home page's search and topic filters.

## Features

- **Bilingual, RTL-aware** — full English and Hebrew, with correct
  left-to-right / right-to-left layout. Source data (which is often Hebrew) is
  displayed verbatim, never translated or transliterated.
- **Light & dark themes** — theme is applied before first paint to avoid a flash.
- **Live open data** — datasets are fetched directly from the data.gov.il CKAN
  API in the browser, validated, and normalized into typed records. No server
  of our own sits in between.
- **Client-side caching** — each live dataset is cached in the browser so
  revisits and reloads don't refetch unnecessarily (see below).
- **Real maps** — geographic datasets (ATMs, antennas) render on an interactive
  Leaflet map using key-free OpenStreetMap tiles.
- **Accurate coordinate handling** — antenna coordinates arrive in the Israeli
  TM Grid (ITM, EPSG:2039) projection and are converted to WGS84 lat/lng with
  `proj4` before plotting — never passed to the map as if they were GPS.
- **Resilient states** — every live page handles loading, error (with retry),
  empty, and partial-data states explicitly, and never falls back to fake data.
- **Accessible** — semantic HTML, keyboard-navigable controls, visible focus,
  and status conveyed by text/labels rather than color alone.

## Tech stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server & build)
- **React Router 7** (client-side routing, lazy-loaded map routes)
- **Tailwind CSS 3** (design tokens for theming)
- **Leaflet** + **react-leaflet** (maps) and **proj4** (ITM → WGS84)
- **lucide-react** (icons)

No application backend — the app is a static single-page app that talks to
data.gov.il directly.

## Getting started

Requires Node.js 18+ and npm.

```bash
npm install       # install dependencies
npm run dev       # start the Vite dev server (http://localhost:5173)
npm run build     # type-check and build for production → dist/
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

## Project structure

```
src/
├── App.tsx                 # routes (map routes are lazy-loaded)
├── pages/                  # one component per dataset page + Home, Organization, NotFound
├── components/
│   ├── layout/PageShell    # shared dataset-page frame (breadcrumbs, title, provenance banner)
│   └── ui/                 # reusable primitives (Select, Tabs, StatCard, maps, …)
├── data/
│   ├── types.ts            # normalized record interfaces for every dataset
│   ├── datasets.ts         # dataset + organization catalog (home/search/org pages)
│   ├── mock/               # sample records for the not-yet-live datasets
│   └── services/           # the single seam between the remote API and the UI:
│                           #   *Api.ts  — fetch + validate + normalize CKAN responses
│                           #   *Store.ts — shared state + caching orchestration
│                           #   *Service.ts — pure query / filter / format helpers
├── lib/                    # cross-cutting helpers (coordinate conversion, caches, …)
├── i18n/                   # bilingual string dictionary + language context
└── theme/                  # light/dark theme context
```

Pages only ever call the `data/services/*` functions; swapping a dataset from
sample data to the live API is contained to that service layer.

## Data, caching & freshness

Live datasets are fetched from the data.gov.il datastore API, validated
(`success === true`, records is an array), paginated when needed, and cached in
the browser. Cache policy is tuned per dataset to balance freshness against
refetching large payloads:

| Dataset | Cache lifetime | Storage |
| --- | --- | --- |
| Flights | 1 hour | localStorage |
| ATM Locations | Daily (Israel calendar day) | localStorage |
| Pharmacies | 72 hours | localStorage |
| Cellular Antennas | Monthly (Israel calendar month) | IndexedDB¹ |

¹ The antenna dataset (~8,500 records, several MB) exceeds the practical
localStorage quota, so it is persisted in IndexedDB.

A failed refresh never overwrites a valid cache — stale data stays visible with
an unobtrusive notice and a retry action, and failures are never cached. Each
live page shows when its data was last fetched; none of it is real-time.

## License & attribution

Data is sourced from Israel's open government data portal, data.gov.il, under
its terms of use. This project is provided for informational purposes only.
