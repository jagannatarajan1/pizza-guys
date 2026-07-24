export function formatPrice(pence: number): string {
  return `£${pence.toFixed(2)}`
}

export function generateOrderNumber(): string {
  return `PG${Date.now().toString().slice(-6)}`
}

// Standard UK postcode format (e.g. "SW1A 1AA", "M1 1AE", "B33 8TH") — kept
// in sync with the server-side check in src/lib/api-guard.ts.
export function isValidPostcode(postcode: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(postcode.trim())
}

// Real Google Maps if an API key is set in Site Settings (Google retired the
// old key-free "q=...&output=embed" trick — it now 404s for any address).
// Falls back to a free OpenStreetMap embed when no key is configured, so the
// map still works out of the box before the owner adds one.
export function mapEmbedSrc(lat: string, lng: string, googleApiKey?: string): string {
  const latN = parseFloat(lat)
  const lngN = parseFloat(lng)

  if (googleApiKey) {
    return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(googleApiKey)}&q=${latN},${lngN}`
  }

  const dLat = 0.004
  const dLng = 0.006
  const bbox = [lngN - dLng, latN - dLat, lngN + dLng, latN + dLat].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latN},${lngN}`
}
