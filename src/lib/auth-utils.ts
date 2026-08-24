import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'

const SECRET = process.env.AUTH_SECRET!
const COOKIE = 'pg_token'

export type JWTPayload = { userId: string; email: string; role: string; tokenVersion: number }

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12)
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload
  } catch {
    return null
  }
}

// Half-finished login for a staff account that has an authenticator app set
// up: proves the first factor was passed without granting a session, and dies
// after 5 minutes. Redeemed by /api/auth/2fa/login once the 6-digit
// authenticator code is supplied. Shared by the password login and the emailed
// -code login so both first factors land on the same second factor.
export function signTwoFactorTempToken(userId: string): string {
  return jwt.sign({ userId, phase: '2fa' }, SECRET, { expiresIn: '5m' })
}

// Same idea as signTwoFactorTempToken: proves the password step of login was
// already passed for this specific user, without granting a session. Redeemed
// by /api/auth/login-otp/verify (and /resend) once the emailed code is
// supplied — every login now passes through this step. 10 minutes covers the
// 5-minute code plus room for one resend cycle.
export function signLoginOtpTempToken(userId: string): string {
  return jwt.sign({ userId, phase: 'login-otp' }, SECRET, { expiresIn: '10m' })
}

export function verifyLoginOtpTempToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, SECRET) as { userId: string; phase: string }
    return payload.phase === 'login-otp' ? { userId: payload.userId } : null
  } catch {
    return null
  }
}

// Privacy-friendly display of an email the user already knows, e.g. for an
// OTP screen's "code sent to j***@gmail.com" — never used to decide anything,
// purely cosmetic.
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  return `${email[0]}***${email.slice(at)}`
}

// Full session check: verifies the JWT itself, then confirms its embedded
// tokenVersion still matches the database. A password change bumps the
// database value, which makes every token issued before that moment fail
// this check on its very next request — that's the entire mechanism behind
// "log out every other device" for an otherwise stateless JWT.
export async function getSessionPayload(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  })
  if (!user || user.tokenVersion !== payload.tokenVersion) return null

  return payload
}

// Whether to mark the session cookie "HTTPS only".
//
// Previously this was `COOKIE_SECURE === 'true'` alone — a variable that isn't
// actually set anywhere, so the live site was handing out session cookies a
// browser would happily replay over plain HTTP. Deciding it from the request
// instead is both safer and impossible to get wrong on deployment: if the
// visitor arrived over HTTPS the cookie is locked to HTTPS, and if the site is
// genuinely served over plain HTTP (or on localhost during development) the
// flag stays off so login still works. COOKIE_SECURE=true can still force it.
function cookieSecure(req?: NextRequest): boolean {
  if (process.env.COOKIE_SECURE === 'true') return true
  if (!req) return process.env.NODE_ENV === 'production'
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim()
  if (proto) return proto === 'https'
  return req.nextUrl.protocol === 'https:'
}

export function setAuthCookie(response: NextResponse, token: string, req?: NextRequest) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(req),
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearAuthCookie(response: NextResponse, req?: NextRequest) {
  // Same flags as when it was set — a browser only replaces a cookie when the
  // name/path/domain/secure attributes line up, so a mismatched clear can
  // leave the original cookie in place.
  response.cookies.set(COOKIE, '', {
    httpOnly: true,
    secure: cookieSecure(req),
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export { COOKIE as AUTH_COOKIE }
