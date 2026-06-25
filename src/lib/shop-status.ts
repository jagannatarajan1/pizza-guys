export type ShopStatus = {
  isOpen: boolean
  deliveryEnabled: boolean
  collectionEnabled: boolean
  shopManuallyOpen: boolean
  todayHours: string
  message: string
}

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function computeShopStatus(cfg: Record<string, string>): ShopStatus {
  const now = new Date()
  const dayIndex = now.getDay()
  const dayKey = DAYS[dayIndex]

  const isClosed = cfg[`hours_${dayKey}_closed`] === 'true'
  const openStr  = cfg[`hours_${dayKey}_open`]  || '11:00'
  const closeStr = cfg[`hours_${dayKey}_close`] || '23:00'

  const [openH, openM]   = openStr.split(':').map(Number)
  const [closeH, closeM] = closeStr.split(':').map(Number)
  const openMins    = openH  * 60 + openM
  const closeMins   = closeH * 60 + closeM
  const currentMins = now.getHours() * 60 + now.getMinutes()

  const withinHours    = !isClosed && currentMins >= openMins && currentMins < closeMins
  const shopManuallyOpen = cfg.shop_open !== 'false'
  const isOpen = withinHours && shopManuallyOpen

  const deliveryEnabled   = isOpen && cfg.shop_delivery   !== 'false'
  const collectionEnabled = isOpen && cfg.shop_collection !== 'false'

  const todayHours = isClosed ? 'Closed today' : `${openStr} – ${closeStr}`

  // Find the next open day for the "closed" message
  function nextOpenLabel(startDayIndex: number): string {
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (startDayIndex + i) % 7
      const nextKey = DAYS[nextIdx]
      if (cfg[`hours_${nextKey}_closed`] !== 'true') {
        const label   = i === 1 ? 'Tomorrow' : DAY_NAMES[nextIdx]
        const time    = cfg[`hours_${nextKey}_open`] || '11:00'
        return `Opens ${label} at ${time}`
      }
    }
    return ''
  }

  let message: string
  if (!shopManuallyOpen) {
    message = 'We are temporarily closed'
  } else if (isClosed) {
    const next = nextOpenLabel(dayIndex)
    message = next ? `Closed today · ${next}` : 'Closed today'
  } else if (currentMins < openMins) {
    message = `Opens at ${openStr}`
  } else if (currentMins >= closeMins) {
    const next = nextOpenLabel(dayIndex)
    message = next ? `Closed · ${next}` : 'Closed'
  } else {
    message = `Open until ${closeStr}`
  }

  return { isOpen, deliveryEnabled, collectionEnabled, shopManuallyOpen, todayHours, message }
}
