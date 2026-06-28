// Role hierarchy: admin > staff > viewer > user
export const ROLES = {
  ADMIN:  'admin',   // super admin — full access
  STAFF:  'staff',   // order manager — orders + customers
  VIEWER: 'viewer',  // read-only — orders + reports
  USER:   'user',    // regular customer
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Nav sections each role can access
export const NAV_PERMISSIONS: Record<string, Role[]> = {
  '/admin':            ['admin', 'staff', 'viewer'],
  '/admin/orders':     ['admin', 'staff', 'viewer'],
  '/admin/products':   ['admin'],
  '/admin/categories': ['admin'],
  '/admin/modifiers':  ['admin'],
  '/admin/offers':     ['admin', 'staff'],
  '/admin/customers':  ['admin', 'staff', 'viewer'],
  '/admin/delivery':   ['admin'],
  '/admin/hours':      ['admin'],
  '/admin/settings':   ['admin'],
  '/admin/reports':    ['admin', 'viewer'],
  '/admin/users':      ['admin'],
  '/admin/security':   ['admin', 'staff', 'viewer'],
  '/admin/migrate':    ['admin'],
}

export function canAccess(role: string, path: string): boolean {
  const allowed = NAV_PERMISSIONS[path]
  if (!allowed) return role === 'admin'
  return (allowed as string[]).includes(role)
}

// API-level guards
export function isAdmin(role: string)  { return role === 'admin' }
export function isStaff(role: string)  { return role === 'admin' || role === 'staff' }
export function isViewer(role: string) { return role === 'admin' || role === 'staff' || role === 'viewer' }

export const ROLE_LABELS: Record<string, string> = {
  admin:  'Super Admin',
  staff:  'Staff',
  viewer: 'Viewer',
  user:   'Customer',
}
