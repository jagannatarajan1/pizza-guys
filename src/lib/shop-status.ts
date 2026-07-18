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

// The shop is physically in Staines-upon-Thames, Surrey, UK — always compute
// "current time" in the shop's own timezone, not the server's. The server
// may be deployed anywhere (e.g. a US or Asia region), so relying on
// `Date.getHours()`/`getDay()` directly would compare the shop's opening
// hours against the wrong clock (and sometimes even the wrong day).
const SHOP_TIMEZONE = 'Europe/London'
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

function getShopLocalTime(date: Date): { dayIndex: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SHOP_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const lookup: Record<string, string> = {}
  for (const part of parts) lookup[part.type] = part.value

  return {
    dayIndex: WEEKDAY_INDEX[lookup.weekday] ?? date.getDay(),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
  }
}

export function computeShopStatus(cfg: Record<string, string>): ShopStatus {
  const now = new Date()
  const { dayIndex, hour, minute } = getShopLocalTime(now)
  const dayKey = DAYS[dayIndex]

  const isClosed = cfg[`hours_${dayKey}_closed`] === 'true'
  const openStr  = cfg[`hours_${dayKey}_open`]  || '11:00'
  const closeStr = cfg[`hours_${dayKey}_close`] || '23:00'

  const [openH, openM]   = openStr.split(':').map(Number)
  const [closeH, closeM] = closeStr.split(':').map(Number)
  const openMins    = openH  * 60 + openM
  const closeMins   = closeH * 60 + closeM
  const currentMins = hour * 60 + minute

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
