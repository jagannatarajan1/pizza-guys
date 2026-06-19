export function formatPrice(pence: number): string {
  return `£${pence.toFixed(2)}`
}

export function isOpen(openingHours: { day: string; open: string; close: string; closed: boolean }[]): {
  isOpen: boolean
  todayHours: string
} {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = days[new Date().getDay()]
  const todayEntry = openingHours.find((h) => h.day === today)
  if (!todayEntry || todayEntry.closed) return { isOpen: false, todayHours: 'Closed today' }

  const now = new Date()
  const [openH, openM] = todayEntry.open.split(':').map(Number)
  const [closeH, closeM] = todayEntry.close.split(':').map(Number)
  const openTime = openH * 60 + openM
  const closeTime = closeH * 60 + closeM
  const currentTime = now.getHours() * 60 + now.getMinutes()

  return {
    isOpen: currentTime >= openTime && currentTime < closeTime,
    todayHours: `${todayEntry.open} - ${todayEntry.close}`,
  }
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
