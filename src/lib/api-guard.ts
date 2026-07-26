import { NextRequest, NextResponse } from 'next/server'
import { getSessionPayload } from './auth-utils'
import type { JWTPayload } from './auth-utils'
import { isValidPostcode } from './utils'

type GuardResult =
  | { ok: true;  payload: JWTPayload }
  | { ok: false; res: NextResponse }

export async function requireAuth(req: NextRequest): Promise<GuardResult> {
  const payload = await getSessionPayload(req)
  if (!payload) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { ok: true, payload }
}

export async function requireAdmin(req: NextRequest): Promise<GuardResult> {
  const r = await requireAuth(req)
  if (!r.ok) return r
  if (!['admin'].includes(r.payload.role))
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return r
}

export async function requireStaff(req: NextRequest): Promise<GuardResult> {
  const r = await requireAuth(req)
  if (!r.ok) return r
  if (!['admin', 'staff'].includes(r.payload.role))
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return r
}

export async function requireViewer(req: NextRequest): Promise<GuardResult> {
  const r = await requireAuth(req)
  if (!r.ok) return r
  if (!['admin', 'staff', 'viewer'].includes(r.payload.role))
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return r
}

// Single source of truth for the password policy — used at signup, reset,
// and change-password so the rule is never weaker in one flow than another.
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8 || password.length > 128) return 'Password must be 8–128 characters'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter'
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter'
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character'
  return null
}

// Validate string fields: trim, enforce max length, reject empty if required
export function sanitizeStr(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLen)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export function validatePhone(phone: string): boolean {
  return /^[\d\s+\-().]{7,20}$/.test(phone)
}

// Delegates to the same check the browser uses, so client and server can never
// disagree about what counts as a valid postcode.
export function validatePostcode(postcode: string): boolean {
  return isValidPostcode(postcode)
}

// Derive the real public origin the request came in on. Prefers reverse-proxy
// headers (x-forwarded-proto/x-forwarded-host), since behind a proxy those
// reflect the address the customer actually used — falls back to req.nextUrl.origin.
export function getOriginFromRequest(req: NextRequest): string {
  const fwdHost  = req.headers.get('x-forwarded-host')
  const fwdProto = req.headers.get('x-forwarded-proto')
  if (fwdHost) {
    const proto = (fwdProto ?? 'https').split(',')[0].trim()
    const host  = fwdHost.split(',')[0].trim()
    return `${proto}://${host}`
  }
  return req.nextUrl.origin
}
