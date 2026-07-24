import prisma from './prisma'

export type Coordinates = { lat: number; lng: number }

function normalize(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, ' ')
}

// postcodes.io is a free, keyless, UK-only postcode lookup — no signup needed.
// Results are cached in our own DB since the same postcodes get looked up
// repeatedly (a UK postcode covers only a handful of houses).
export async function geocodePostcode(postcode: string): Promise<Coordinates | null> {
  const normalized = normalize(postcode)
  if (!normalized) return null

  const cached = await prisma.postcodeGeocode.findUnique({ where: { postcode: normalized } })
  if (cached) return { lat: cached.latitude, lng: cached.longitude }

  let data: { status?: number; result?: { latitude: number; longitude: number } }
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalized)}`)
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }

  if (data.status !== 200 || !data.result) return null
  const { latitude, longitude } = data.result

  await prisma.postcodeGeocode.upsert({
    where: { postcode: normalized },
    create: { postcode: normalized, latitude, longitude },
    update: { latitude, longitude, cachedAt: new Date() },
  }).catch(() => {})

  return { lat: latitude, lng: longitude }
}
