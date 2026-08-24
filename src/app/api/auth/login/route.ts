import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signLoginOtpTempToken, maskEmail } from '@/lib/auth-utils'
import { rateLimit, rateLimitMulti, getClientIp } from '@/lib/rate-limit'
import { issueLoginOtp, otpCooldown, otpRequestLimits, otpScopeConfig, isStaffRole, type OtpScope } from '@/lib/login-otp'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  // 10 login attempts per IP per 15 minutes
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const body       = await req.json().catch(() => ({}))
  const identifier = ((body.email ?? '') as string).trim().toLowerCase()
  const password   = (body.password ?? '') as string

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
  })

  // Account locked?
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` },
      { status: 423 }
    )
  }

  const valid = user && await verifyPassword(password, user.passwordHash)

  if (!valid) {
    if (user) {
      const attempts = (user.failedLogins ?? 0) + 1
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: attempts,
          lockedUntil:  attempts >= MAX_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null,
        },
      })
    }
    // Same error for both "user not found" and "wrong password" — prevents user enumeration
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // Reset failed attempts on successful password check
  if (user.failedLogins > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data:  { failedLogins: 0, lockedUntil: null },
    })
  }

  // Password is correct, but no session is created yet — every login (customer
  // or staff) must also clear an emailed one-time code before a session
  // exists. The temp token below proves "password already verified for this
  // user" to /api/auth/login-otp/verify and /resend without granting access
  // to anything itself.
  const scope: OtpScope = isStaffRole(user.role) ? 'admin' : 'user'

  // Cooldown active — a code was already sent moments ago (e.g. a double
  // submit); don't mint another one, just move the caller on to the OTP
  // screen for the code already in flight. Checked first and short-circuited
  // so that repeatedly submitting the login form within the cooldown window
  // never spends the (much smaller) request-limit budget for an email that
  // was never actually going to be sent again.
  const cooldown = otpCooldown(scope, user.email)
  if (!cooldown.limited) {
    const requestLimited = rateLimitMulti(otpRequestLimits(scope, user.email, ip))
    if (requestLimited.limited) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }
    await issueLoginOtp({ scope, email: user.email, ip })
  }

  const tempToken = signLoginOtpTempToken(user.id)
  return NextResponse.json({
    requiresOtp:     true,
    tempToken,
    maskedEmail:     maskEmail(user.email),
    cooldownSeconds: otpScopeConfig(scope).cooldownSeconds,
  })
}
