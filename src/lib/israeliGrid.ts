import proj4 from 'proj4'

/**
 * Coordinate handling for the ATM dataset.
 *
 * The source dataset (data.gov.il resource 21fde05f…) stores locations
 * inconsistently, verified by inspecting the live response:
 *  - Most records are already WGS84 decimal degrees, but the axis order is not
 *    consistent — usually X=latitude, Y=longitude, occasionally swapped.
 *  - A few records use the projected **Israeli TM Grid (EPSG:2039, "Israel
 *    1993 / Israeli TM Grid", ITM)** with X=easting, Y=northing in metres.
 *
 * The two cases are unambiguous by magnitude: ITM eastings/northings are in the
 * hundreds of thousands, whereas Israel's lat/lng are ~29–36. We convert ITM
 * via proj4 and normalise everything to {lat, lng}, then validate against an
 * Israel bounding box so a malformed record yields `null` (excluded from the
 * map) rather than a misleading marker.
 */

// EPSG:2039 — Israel 1993 / Israeli TM Grid. Parameters per the EPSG registry.
// The towgs84 datum shift is sub-metre for display purposes; GRS80≈WGS84.
const ITM =
  '+proj=tmerc +lat_0=31.7343936111111 +lon_0=35.2045169444444 +k=1.0000067 ' +
  '+x_0=219529.584 +y_0=626907.39 +ellps=GRS80 ' +
  '+towgs84=-24.0024,-17.1032,-17.8444,-0.33077,-1.85269,1.66969,5.4262 ' +
  '+units=m +no_defs'

proj4.defs('EPSG:2039', ITM)
const itmToWgs84 = proj4('EPSG:2039', 'WGS84')

// Generous Israel bounding box (incl. the south to Eilat) used to sanity-check
// every converted point.
const inLat = (v: number) => v >= 29.0 && v <= 33.6
const inLng = (v: number) => v >= 34.0 && v <= 36.0

export interface LatLng {
  lat: number
  lng: number
}

function toNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string') {
    const n = Number.parseFloat(v.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

/**
 * Convert a raw source X/Y pair to WGS84 {lat, lng}, or `null` when the values
 * are missing, unparseable, or fall outside Israel. Never throws.
 */
export function parseIsraeliCoords(xRaw: unknown, yRaw: unknown): LatLng | null {
  const x = toNumber(xRaw)
  const y = toNumber(yRaw)
  if (x === null || y === null || x === 0 || y === 0) return null

  let lat: number
  let lng: number

  if (Math.abs(x) > 1000 || Math.abs(y) > 1000) {
    // Projected Israeli TM grid: X=easting, Y=northing. proj4 returns [lng,lat].
    try {
      const [lo, la] = itmToWgs84.forward([x, y])
      lat = la
      lng = lo
    } catch {
      return null
    }
  } else if (inLat(x) && inLng(y)) {
    lat = x
    lng = y
  } else if (inLng(x) && inLat(y)) {
    // Swapped axis order seen in a small number of records.
    lat = y
    lng = x
  } else {
    return null
  }

  if (!inLat(lat) || !inLng(lng)) return null
  return { lat, lng }
}
