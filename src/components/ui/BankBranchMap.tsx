import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { BankBranch } from '../../data/types'

/**
 * Real interactive map of bank-branch locations, built on Leaflet. Mirrors the
 * ATM / antenna maps — key-free OpenStreetMap tiles (dark mode via a CSS filter
 * on the tile pane in index.css), and markers drawn imperatively as canvas
 * circle markers in a single layer group so rendering hundreds of points stays
 * cheap and React never reconciles one component per marker.
 *
 * Only branches whose coordinates resolved to valid WGS84 are plotted; the rest
 * keep their details in the list. The plotted set follows the active filters.
 */

const ISRAEL_CENTER: [number, number] = [31.4, 35.0]
const ISRAEL_ZOOM = 7

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// Blue — the app's primary accent.
const BASE_STYLE: L.CircleMarkerOptions = {
  radius: 5,
  color: '#1d4ed8', // blue-700 ring
  weight: 1.25,
  fillColor: '#3b82f6', // blue-500
  fillOpacity: 0.8,
}

const SELECTED_STYLE: L.CircleMarkerOptions = {
  radius: 9,
  color: '#ffffff',
  weight: 2.5,
  fillColor: '#2563eb', // blue-600
  fillOpacity: 1,
}

export interface BankBranchMapLabels {
  /** Label prefix for the branch code in the popup, e.g. "Branch". */
  branch: string
}

interface BankBranchMapProps {
  /** Filtered branch set — only records with coordinates are plotted. */
  branches: BankBranch[]
  selectedId: string | null
  onSelect: (id: string) => void
  labels: BankBranchMapLabels
  /** Active language, for popup text direction. */
  dir: 'ltr' | 'rtl'
  className?: string
}

/** Build a safe popup DOM node (textContent — no HTML injection from data). */
function popupNode(
  b: BankBranch,
  labels: BankBranchMapLabels,
  dir: 'ltr' | 'rtl',
): HTMLElement {
  const root = document.createElement('div')
  root.className = 'atm-popup-body'
  root.dir = dir

  const title = document.createElement('p')
  title.className = 'atm-popup-title'
  title.textContent = b.bankName || '—'
  root.appendChild(title)

  const sub = document.createElement('p')
  sub.className = 'atm-popup-text'
  sub.textContent = [b.branchName, [b.address, b.city].filter(Boolean).join(', ')]
    .filter(Boolean)
    .join(' · ')
  root.appendChild(sub)

  if (b.branchCode) {
    const meta = document.createElement('p')
    meta.className = 'atm-popup-meta'
    meta.textContent = `${labels.branch} ${b.branchCode}`
    root.appendChild(meta)
  }
  return root
}

/** Imperative marker layer — rebuilt only when the plotted set changes. */
function MarkerLayer({ branches, selectedId, onSelect, labels, dir }: BankBranchMapProps) {
  const map = useMap()
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const cbRef = useRef({ onSelect, labels, dir })
  cbRef.current = { onSelect, labels, dir }

  useEffect(() => {
    const plottable = branches.filter((b) => b.lat !== null && b.lng !== null)
    const group = L.layerGroup().addTo(map)
    const markers = new Map<string, L.CircleMarker>()

    for (const b of plottable) {
      const marker = L.circleMarker([b.lat as number, b.lng as number], BASE_STYLE)
      marker.bindPopup(() => popupNode(b, cbRef.current.labels, cbRef.current.dir))
      marker.on('click', () => cbRef.current.onSelect(b.id))
      marker.addTo(group)
      markers.set(b.id, marker)
    }
    markersRef.current = markers

    const fit = (): boolean => {
      if (plottable.length === 0) {
        map.setView(ISRAEL_CENTER, ISRAEL_ZOOM)
        return true
      }
      if (map.getSize().x === 0) return false
      const bounds = L.latLngBounds(
        plottable.map((b) => [b.lat as number, b.lng as number] as [number, number]),
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
  }, [branches, map])

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
  }, [selectedId, map, branches])

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

export default function BankBranchMap(props: BankBranchMapProps) {
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
