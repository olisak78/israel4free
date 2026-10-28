import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Atm } from '../../data/types'

/**
 * Real interactive map of ATM locations, built on Leaflet. Uses OpenStreetMap's
 * standard tiles, which require no API key or billing. Dark mode is applied as a
 * CSS filter on the tile pane (see `.dark .leaflet-tile-pane` in index.css), so
 * markers and popups stay un-inverted. Markers are drawn imperatively as canvas
 * circle markers in a single layer group, so rendering thousands of points
 * stays cheap and React never reconciles one component per marker.
 */

const ISRAEL_CENTER: [number, number] = [31.4, 35.0]
const ISRAEL_ZOOM = 7

// Key-free OpenStreetMap standard tiles. Dark theme is handled via CSS filter.
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const BASE_STYLE: L.CircleMarkerOptions = {
  radius: 6,
  color: '#047857', // emerald-700 ring
  weight: 1.5,
  fillColor: '#10b981', // emerald-500
  fillOpacity: 0.85,
}

const SELECTED_STYLE: L.CircleMarkerOptions = {
  radius: 10,
  color: '#ffffff',
  weight: 2.5,
  fillColor: '#059669',
  fillOpacity: 1,
}

export interface AtmMapLabels {
  /** Label prefix for the ATM identifier in the popup, e.g. "ATM". */
  atm: string
}

interface AtmMapProps {
  /** Filtered ATM set — only records with coordinates are plotted. */
  atms: Atm[]
  selectedId: string | null
  onSelect: (id: string) => void
  labels: AtmMapLabels
  /** Active language, for popup text direction. */
  dir: 'ltr' | 'rtl'
  className?: string
}

/** Build a safe popup DOM node (textContent — no HTML injection from data). */
function popupNode(atm: Atm, labels: AtmMapLabels, dir: 'ltr' | 'rtl'): HTMLElement {
  const root = document.createElement('div')
  root.className = 'atm-popup-body'
  root.dir = dir

  const bank = document.createElement('p')
  bank.className = 'atm-popup-title'
  bank.textContent = atm.bankName || '—'
  root.appendChild(bank)

  const addr = document.createElement('p')
  addr.className = 'atm-popup-text'
  addr.textContent = [atm.address, atm.city].filter(Boolean).join(', ')
  root.appendChild(addr)

  if (atm.atmNumber !== null) {
    const num = document.createElement('p')
    num.className = 'atm-popup-meta'
    num.textContent = `${labels.atm} ${atm.atmNumber}`
    root.appendChild(num)
  }
  return root
}

/** Imperative marker layer — rebuilt only when the plotted set changes. */
function MarkerLayer({ atms, selectedId, onSelect, labels, dir }: AtmMapProps) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  // Keep latest callbacks/labels without forcing a marker rebuild.
  const cbRef = useRef({ onSelect, labels, dir })
  cbRef.current = { onSelect, labels, dir }

  // Rebuild markers + refit bounds when the plotted dataset changes.
  useEffect(() => {
    const plottable = atms.filter((a) => a.lat !== null && a.lng !== null)
    const group = L.layerGroup().addTo(map)
    const markers = new Map<string, L.CircleMarker>()

    for (const a of plottable) {
      const marker = L.circleMarker([a.lat as number, a.lng as number], BASE_STYLE)
      marker.bindPopup(() =>
        popupNode(a, cbRef.current.labels, cbRef.current.dir),
      )
      marker.on('click', () => cbRef.current.onSelect(a.id))
      marker.addTo(group)
      markers.set(a.id, marker)
    }
    markersRef.current = markers

    // Fit to the markers. If the container is still hidden (size 0, e.g. the
    // mobile map tab), defer the fit until it first gains a size.
    const fit = (): boolean => {
      if (plottable.length === 0) {
        map.setView(ISRAEL_CENTER, ISRAEL_ZOOM)
        return true
      }
      if (map.getSize().x === 0) return false
      const bounds = L.latLngBounds(
        plottable.map(
          (a) => [a.lat as number, a.lng as number] as [number, number],
        ),
      )
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 })
      return true
    }

    let observer: ResizeObserver | null = null
    if (!fit()) {
      observer = new ResizeObserver(() => {
        if (fit()) observer?.disconnect()
      })
      observer.observe(map.getContainer())
    }

    return () => {
      observer?.disconnect()
      group.remove()
      markersRef.current = new Map()
    }
  }, [atms, map])

  // Highlight + focus the selected marker (from list or map selection).
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.setStyle(id === selectedId ? SELECTED_STYLE : BASE_STYLE)
    }
    if (selectedId) {
      const marker = markersRef.current.get(selectedId)
      if (marker) {
        marker.bringToFront()
        map.panTo(marker.getLatLng(), { animate: true })
        marker.openPopup()
      }
    }
  }, [selectedId, map, atms])

  return null
}

/** Keeps Leaflet's internal size in sync when the container resizes/unhides. */
function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    // Initial correction (e.g. when revealed via a mobile tab).
    map.invalidateSize()
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function AtmMap(props: AtmMapProps) {
  const { className = '' } = props

  return (
    <div className={`overflow-hidden rounded-card border border-edge ${className}`}>
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={ISRAEL_ZOOM}
        scrollWheelZoom
        preferCanvas
        className="h-full w-full"
        // Leaflet manages its own ARIA; the list is the primary accessible path.
      >
        {/* Key-free OSM tiles; dark mode via a CSS filter on the tile pane. */}
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <MarkerLayer {...props} />
        <ResizeHandler />
      </MapContainer>
    </div>
  )
}
