export function formatPrice(pence: number): string {
  return `£${pence.toFixed(2)}`
}

export function checkDelivery(
  postcode: string,
  zones: { postcode: string; minOrder: number; deliveryFee: number }[]
): { available: boolean; fee: number; minOrder: number } | null {
  const prefix = postcode.trim().toUpperCase().split(' ')[0]
  const zone = zones.find((z) => prefix.startsWith(z.postcode))
  if (!zone) return null
  return { available: true, fee: zone.deliveryFee, minOrder: zone.minOrder }
}

export function generateOrderNumber(): string {
  return `PG${Date.now().toString().slice(-6)}`
}
