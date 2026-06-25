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

