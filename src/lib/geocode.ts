import prisma from './prisma'

export type Coordinates = { lat: number; lng: number }

// "This postcode doesn't exist" and "we couldn't reach the lookup service"
// are very different things to tell a customer — the first is their typo to
// fix, the second is our problem and must never block a legitimate order
// with a message blaming their address.
export type GeocodeResult =
  | { ok: true; coords: Coordinates }
  | { ok: false; reason: 'not_found' | 'lookup_failed' }

const LOOKUP_TIMEOUT_MS = 5000

// Collapse every way a customer might type a postcode ("tw170ah",
// "TW17 0AH", "tw17  0ah") down to one canonical form. A UK postcode's last
// three characters are always the inward code, so the split point is fixed.
// Without this, the same real address gets cached under several different
// keys — every variant misses the cache and re-hits the lookup service.
function normalize(postcode: string): string {
  const compact = postcode.trim().toUpperCase().replace(/\s+/g, '')
  if (compact.length < 5) return compact
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`
}

// postcodes.io is a free, keyless, UK-only postcode lookup — no signup needed.
// Results are cached in our own DB since the same postcodes get looked up
// repeatedly (a UK postcode covers only a handful of houses).
export async function geocodePostcode(postcode: string): Promise<GeocodeResult> {
  const normalized = normalize(postcode)
  if (!normalized) return { ok: false, reason: 'not_found' }

  const cached = await prisma.postcodeGeocode
    .findUnique({ where: { postcode: normalized } })
    .catch(() => null)
  if (cached) return { ok: true, coords: { lat: cached.latitude, lng: cached.longitude } }

  let data: { status?: number; result?: { latitude: number; longitude: number } }
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    })
    // A 404 is a real answer: this postcode isn't registered. Anything else
    // (5xx, rate limit) means the service failed us, not that the address is bad.
    if (res.status === 404) return { ok: false, reason: 'not_found' }
    if (!res.ok) return { ok: false, reason: 'lookup_failed' }
    data = await res.json()
  } catch {
    // Network error, DNS failure, or our own timeout firing.
    return { ok: false, reason: 'lookup_failed' }
  }

  if (data.status === 404) return { ok: false, reason: 'not_found' }
  if (data.status !== 200 || !data.result) return { ok: false, reason: 'lookup_failed' }
  const { latitude, longitude } = data.result

  await prisma.postcodeGeocode.upsert({
    where: { postcode: normalized },
    create: { postcode: normalized, latitude, longitude },
    update: { latitude, longitude, cachedAt: new Date() },
  }).catch(() => {})

  return { ok: true, coords: { lat: latitude, lng: longitude } }
}
