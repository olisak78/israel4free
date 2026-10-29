import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CellAntenna } from '../../data/types'

/**
 * Real interactive map of cellular-antenna sites, built on Leaflet. Mirrors
 * `AtmMap` — key-free OpenStreetMap tiles (dark mode via a CSS filter on the
 * tile pane in index.css), and markers drawn imperatively as canvas circle
 * markers in a single layer group so rendering thousands of points stays cheap
 * and React never reconciles one component per marker.
 *
 * The plotted set follows the active filters/search (the page passes the
 * filtered records), and only records whose ITM coordinates resolved to valid
 * WGS84 are plotted — the rest keep their details in the list.
 */

const ISRAEL_CENTER: [number, number] = [31.4, 35.0]
const ISRAEL_ZOOM = 7

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const BASE_STYLE: L.CircleMarkerOptions = {
  radius: 5,
  color: '#b45309', // amber-700 ring
  weight: 1.25,
  fillColor: '#f59e0b', // amber-500
  fillOpacity: 0.8,
}

const SELECTED_STYLE: L.CircleMarkerOptions = {
  radius: 9,
  color: '#ffffff',
  weight: 2.5,
  fillColor: '#d97706', // amber-600
  fillOpacity: 1,
}

export interface AntennaMapLabels {
  /** Label prefix for the site identifier in the popup, e.g. "Site". */
  site: string
}

interface AntennaMapProps {
  /** Filtered antenna set — only records with coordinates are plotted. */
  antennas: CellAntenna[]
  selectedId: string | null
  onSelect: (id: string) => void
  labels: AntennaMapLabels
  /** Active language, for popup text direction. */
  dir: 'ltr' | 'rtl'
  className?: string
}

/** Build a safe popup DOM node (textContent — no HTML injection from data). */
function popupNode(
  a: CellAntenna,
  labels: AntennaMapLabels,
  dir: 'ltr' | 'rtl',
): HTMLElement {
  const root = document.createElement('div')
  root.className = 'atm-popup-body'
  root.dir = dir

  const title = document.createElement('p')
  title.className = 'atm-popup-title'
  title.textContent = a.company || '—'
  root.appendChild(title)

  const addr = document.createElement('p')
  addr.className = 'atm-popup-text'
  addr.textContent = [a.address, a.city].filter(Boolean).join(', ')
  root.appendChild(addr)

  const meta = document.createElement('p')
  meta.className = 'atm-popup-meta'
  meta.textContent = [
    a.siteId ? `${labels.site} ${a.siteId}` : '',
    a.siteType,
  ]
    .filter(Boolean)
    .join(' · ')
  if (meta.textContent) root.appendChild(meta)

  return root
}

/** Imperative marker layer — rebuilt only when the plotted set changes. */
function MarkerLayer({ antennas, selectedId, onSelect, labels, dir }: AntennaMapProps) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const cbRef = useRef({ onSelect, labels, dir })
  cbRef.current = { onSelect, labels, dir }

  useEffect(() => {
    const plottable = antennas.filter((a) => a.lat !== null && a.lng !== null)
    const group = L.layerGroup().addTo(map)
    const markers = new Map<string, L.CircleMarker>()

    for (const a of plottable) {
      const marker = L.circleMarker([a.lat as number, a.lng as number], BASE_STYLE)
      marker.bindPopup(() => popupNode(a, cbRef.current.labels, cbRef.current.dir))
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
        plottable.map((a) => [a.lat as number, a.lng as number] as [number, number]),
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
  }, [antennas, map])

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
  }, [selectedId, map, antennas])

  return null
}

/** Keeps Leaflet's internal size in sync when the container resizes/unhides. */
function ResizeHandler() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    map.invalidateSize()
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function AntennaMap(props: AntennaMapProps) {
  const { className = '' } = props

  return (
    <div className={`overflow-hidden rounded-card border border-edge ${className}`}>
      <MapContainer
        center={ISRAEL_CENTER}
        zoom={ISRAEL_ZOOM}
        scrollWheelZoom
        preferCanvas
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <MarkerLayer {...props} />
        <ResizeHandler />
      </MapContainer>
    </div>
  )
}
