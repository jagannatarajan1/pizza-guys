export function formatPrice(pence: number): string {
  return `£${pence.toFixed(2)}`
}

export function generateOrderNumber(): string {
  return `PG${Date.now().toString().slice(-6)}`
}

// Standard UK postcode format (e.g. "SW1A 1AA", "M1 1AE", "B33 8TH"), space
// optional. Single source of truth — api-guard's validatePostcode delegates
// here so a server request can never be judged by a different rule than the
// one the customer's browser already applied.
export function isValidPostcode(postcode: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(postcode.trim())
}

// Only these can ever end up as an iframe src. Site Settings is admin-only,
// but the value lands in a frame, so it's checked rather than trusted — and
// it keeps the allowed hosts in step with next.config.ts's frame-src.
const ALLOWED_MAP_EMBED_HOSTS = ['https://www.google.com/maps/embed', 'https://www.openstreetmap.org/export/embed']

// Preference order: the embed URL pasted from Google Maps' "Share → Embed a
// map" (no API key needed, points at the real business listing), then the
// Maps Embed API if a key is configured, then a free OpenStreetMap embed so
// there's always a working map out of the box.
export function mapEmbedSrc(lat: string, lng: string, googleApiKey?: string, embedUrl?: string): string {
  const latN = parseFloat(lat)
  const lngN = parseFloat(lng)

  const trimmedEmbed = embedUrl?.trim()
  if (trimmedEmbed && ALLOWED_MAP_EMBED_HOSTS.some((prefix) => trimmedEmbed.startsWith(prefix))) {
    return trimmedEmbed
  }

  if (googleApiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleApiKey)}&q=${latN},${lngN}`
  }

  const dLat = 0.004
  const dLng = 0.006
  const bbox = [lngN - dLng, latN - dLat, lngN + dLng, latN + dLat].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latN},${lngN}`
}
