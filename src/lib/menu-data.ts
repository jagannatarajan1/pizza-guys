// Re-export shared types so existing imports keep working
export type { ModifierOption, ModifierGroup, Product, Category } from './types'

// ── Static business config ─────────────────────────────────────────────────────
// These are managed in code (not the DB) for now.

export const openingHours = [
  { day: 'Monday',    open: '11:00', close: '23:00', closed: false },
  { day: 'Tuesday',   open: '11:00', close: '23:00', closed: false },
  { day: 'Wednesday', open: '11:00', close: '23:00', closed: false },
  { day: 'Thursday',  open: '11:00', close: '23:00', closed: false },
  { day: 'Friday',    open: '11:00', close: '23:30', closed: false },
  { day: 'Saturday',  open: '11:00', close: '23:30', closed: false },
  { day: 'Sunday',    open: '12:00', close: '23:00', closed: false },
]

export const deliveryZones = [
  { postcode: 'TW18', minOrder: 10.0,  deliveryFee: 1.99 },
  { postcode: 'TW19', minOrder: 10.0,  deliveryFee: 1.99 },
  { postcode: 'TW20', minOrder: 12.0,  deliveryFee: 2.49 },
  { postcode: 'KT16', minOrder: 12.0,  deliveryFee: 2.49 },
  { postcode: 'GU25', minOrder: 15.0,  deliveryFee: 2.99 },
]

export const activeCoupons = [
  { code: 'PIZZA10',     type: 'percentage',   value: 10, minOrder: 15, description: '10% off orders over £15' },
  { code: 'FIRSTORDER',  type: 'fixed',        value: 5,  minOrder: 20, description: '£5 off your first order' },
  { code: 'FREEDEL',     type: 'freeDelivery', value: 0,  minOrder: 20, description: 'Free delivery on orders over £20' },
]
