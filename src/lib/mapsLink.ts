/**
 * Safe derivation of a Google Maps "directions" URL for a pharmacy.
 *
 * The government `map` field is an HTML snippet like:
 *   <a href="https://www.google.com/maps/dir/?api=1&destination=…">
 *     <img src="…maps_pointer.jpg" …>
 *   </a>
 *
 * We never render that HTML (no `dangerouslySetInnerHTML`) and never surface the
 * image. Instead we parse it with `DOMParser` in `text/html` mode — which builds
 * an inert document without running scripts or loading the `<img>` — extract the
 * anchor href, and accept it only if it validates as a Google Maps URL. When the
 * link is missing or untrusted, we fall back to building a directions URL from
 * the pharmacy's own address.
 */

// Google-owned hosts we trust for a maps link. `goo.gl` / `maps.app.goo.gl` are
// Google's own short-link domains and appear in a few source records.
const ALLOWED_HOSTS = new Set([
  'google.com',
  'www.google.com',
  'maps.google.com',
  'goo.gl',
  'maps.app.goo.gl',
])

/** True only for an https Google Maps URL (directions or destination). */
function isTrustedGoogleMapsUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (!ALLOWED_HOSTS.has(url.hostname)) return false
  // On google.com the path must be a maps path; the short-link domains are
  // maps-only by definition, so their path isn't constrained here.
  if (url.hostname.endsWith('google.com') && !url.pathname.startsWith('/maps')) {
    return false
  }
  return true
}

/** Extract the first anchor href from an HTML snippet, safely and inertly. */
function extractAnchorHref(html: string): string | null {
  if (!html) return null
  if (typeof DOMParser !== 'undefined') {
    try {
      // 'text/html' yields an inert document: no script execution, no image load.
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const href = doc.querySelector('a[href]')?.getAttribute('href')
      return href ? href.trim() : null
    } catch {
      /* fall through to the regex fallback */
    }
  }
  const match = html.match(/href\s*=\s*"([^"]+)"/i) ?? html.match(/href\s*=\s*'([^']+)'/i)
  return match ? match[1].trim() : null
}

/** Build a directions URL from address parts, or null if there's nothing usable. */
function buildFromAddress(street: string, city: string): string | null {
  const destination = [street, city].filter(Boolean).join(', ').trim()
  if (!destination) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

/**
 * Resolve a trustworthy Google Maps directions URL for one pharmacy.
 *
 * Prefers a validated link parsed from the source `map` HTML; otherwise builds
 * one from the address. Returns `null` when neither is possible — callers omit
 * the action rather than render a broken link.
 */
export function safeDirectionsUrl(
  mapHtml: string,
  street: string,
  city: string,
): string | null {
  const href = extractAnchorHref(mapHtml)
  if (href && isTrustedGoogleMapsUrl(href)) return href
  return buildFromAddress(street, city)
}
