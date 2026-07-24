import prisma from './prisma'
import { fetchSiteConfig } from './site-config'
import { geocodePostcode } from './geocode'
import { haversineMiles } from './distance'

export type DeliveryResult =
  | {
      available: true; distanceMiles: number; minOrder: number; deliveryFee: number
      freeDeliveryApplied: boolean; freeDeliveryThreshold: number
    }
  | { available: false; reason: 'not_found' | 'out_of_range' | 'no_band'; distanceMiles?: number }

// Single source of truth for "can we deliver here, and for how much" — used
// both by the public postcode-check endpoint (for UI feedback) and by the
// checkout route (for the actual charge). Money amounts are in pence.
// subtotalPence lets it apply the admin-configured "free delivery over £X"
// threshold consistently everywhere delivery fee is calculated, rather than
// leaving that logic to be duplicated (and possibly drift) per caller.
export async function resolveDelivery(postcode: string, subtotalPence = 0): Promise<DeliveryResult> {
  const coords = await geocodePostcode(postcode)
  if (!coords) return { available: false, reason: 'not_found' }

  const cfg = await fetchSiteConfig()
  const restaurantLat = parseFloat(cfg.biz_map_lat)
  const restaurantLng = parseFloat(cfg.biz_map_lng)
  const maxRadius = parseFloat(cfg.delivery_max_radius_miles) || 3

  const distanceMiles = haversineMiles(restaurantLat, restaurantLng, coords.lat, coords.lng)

  if (distanceMiles > maxRadius) {
    return { available: false, reason: 'out_of_range', distanceMiles }
  }

  const band = await prisma.deliveryBand.findFirst({
    where: { fromMiles: { lte: distanceMiles }, toMiles: { gte: distanceMiles } },
    orderBy: { fromMiles: 'asc' },
  })

  if (!band) return { available: false, reason: 'no_band', distanceMiles }

  const freeDeliveryThreshold = Math.round((parseFloat(cfg.free_delivery_threshold) || 0) * 100)
  const freeDeliveryApplied = freeDeliveryThreshold > 0 && subtotalPence >= freeDeliveryThreshold

  return {
    available: true,
    distanceMiles,
    minOrder: band.minOrder,
    deliveryFee: freeDeliveryApplied ? 0 : band.deliveryFee,
    freeDeliveryApplied,
    freeDeliveryThreshold,
  }
}
