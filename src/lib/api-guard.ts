import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from './auth-utils'
import type { JWTPayload } from './auth-utils'

type GuardResult =
  | { ok: true;  payload: JWTPayload }
  | { ok: false; res: NextResponse }

export function requireAuth(req: NextRequest): GuardResult {
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { ok: true, payload }
}

export function requireAdmin(req: NextRequest): GuardResult {
  const r = requireAuth(req)
  if (!r.ok) return r
  if (!['admin'].includes(r.payload.role))
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return r
}

export function requireStaff(req: NextRequest): GuardResult {
  const r = requireAuth(req)
  if (!r.ok) return r
  if (!['admin', 'staff'].includes(r.payload.role))
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return r
}

export function requireViewer(req: NextRequest): GuardResult {
  const r = requireAuth(req)
  if (!r.ok) return r
  if (!['admin', 'staff', 'viewer'].includes(r.payload.role))
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return r
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

// Standard UK postcode format (e.g. "SW1A 1AA", "M1 1AE", "B33 8TH") — space
// optional/anywhere, case-insensitive.
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

export function validatePostcode(postcode: string): boolean {
  return UK_POSTCODE_RE.test(postcode.trim())
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
