import type { ReactNode } from 'react'
import { MapPin } from 'lucide-react'

export interface MapPoint {
  id: string
  lat: number
  lng: number
}

interface MapPreviewProps {
  points: MapPoint[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  /** Honest caption clarifying this is a schematic, not a live street map. */
  caption: string
  /** Accessible label for the plot region. */
  ariaLabel: string
  /** Popover content rendered for the selected point. */
  renderPopover?: (id: string) => ReactNode
  /** Tailwind classes for a point's marker, by id (defaults to brand). */
  markerClass?: (id: string) => string
  className?: string
}

/**
 * Schematic location plot. Markers are positioned by their REAL relative
 * coordinates (normalized into the viewport), so geographic relationships are
 * genuine — but there are no street tiles, and the caption states plainly that
 * an interactive map is planned. This is deliberately NOT dressed up as a live
 * map. Reused by every geographic dataset page.
 */
export default function MapPreview({
  points,
  selectedId,
  onSelect,
  caption,
  ariaLabel,
  renderPopover,
  markerClass,
  className = '',
}: MapPreviewProps) {
  // Bounding box across the visible points, with padding so markers never sit
  // on the very edge. Falls back to a centered single point.
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latSpan = maxLat - minLat || 1
  const lngSpan = maxLng - minLng || 1

  function position(p: MapPoint) {
    // x from longitude, y from latitude (north = up, so invert). 8–92% range.
    const x = points.length === 1 ? 50 : 8 + ((p.lng - minLng) / lngSpan) * 84
    const y = points.length === 1 ? 50 : 8 + ((maxLat - p.lat) / latSpan) * 84
    return { left: `${x}%`, top: `${y}%` }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-card border border-edge bg-surface-2 ${className}`}
    >
      {/* Schematic grid backdrop — clearly abstract, not cartographic */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.5] dark:opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgb(var(--c-edge)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--c-edge)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Plot region */}
      <div
        role="group"
        aria-label={ariaLabel}
        className="relative h-full min-h-[18rem] w-full"
      >
        {points.map((p) => {
          const selected = p.id === selectedId
          return (
            <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={position(p)}>
              <button
                type="button"
                onClick={() => onSelect?.(p.id)}
                aria-pressed={selected}
                className={`group flex items-center justify-center rounded-full transition-transform motion-reduce:transition-none ${
                  selected ? 'z-20 scale-125' : 'z-10 hover:scale-110'
                }`}
              >
                <MapPin
                  className={`h-6 w-6 drop-shadow ${markerClass?.(p.id) ?? 'text-brand'} ${
                    selected ? 'fill-current' : ''
                  }`}
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
              </button>

              {selected && renderPopover && (
                <div className="absolute bottom-full start-1/2 z-30 mb-1 w-56 -translate-x-1/2 rtl:translate-x-1/2">
                  <div className="rounded-lg border border-edge bg-surface-3 p-3 text-start shadow-card-hover">
                    {renderPopover(p.id)}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Honest provenance caption */}
      <div className="absolute inset-x-0 bottom-0 border-t border-edge bg-surface/90 px-3 py-1.5 text-center text-[0.7rem] text-muted backdrop-blur">
        {caption}
      </div>
    </div>
  )
}
