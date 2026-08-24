import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { maskEmail, verifyLoginOtpTempToken } from '@/lib/auth-utils'
import { rateLimitMulti, getClientIp } from '@/lib/rate-limit'
import { issueLoginOtp, otpCooldown, otpRequestLimits, otpScopeConfig, isStaffRole, type OtpScope } from '@/lib/login-otp'

// Resend for the mandatory post-password OTP step. The 30s cooldown here is
// the real, server-side one — the frontend countdown is cosmetic and just
// mirrors cooldownSeconds back from /api/auth/login and this endpoint.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  const body      = await req.json().catch(() => ({}))
  const tempToken = (body.tempToken ?? '') as string
  if (!tempToken) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  const claim = verifyLoginOtpTempToken(tempToken)
  if (!claim) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { id: claim.userId } })
  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` },
      { status: 423 }
    )
  }

  const scope: OtpScope = isStaffRole(user.role) ? 'admin' : 'user'

  const cooldown = otpCooldown(scope, user.email)
  if (cooldown.limited) {
    return NextResponse.json(
      { error: 'Please wait before requesting another code.', retryAfter: cooldown.retryAfter },
      { status: 429 }
    )
  }

  const requestLimited = rateLimitMulti(otpRequestLimits(scope, user.email, ip))
  if (requestLimited.limited) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  // Issuing a fresh code invalidates whatever was previously outstanding.
  await issueLoginOtp({ scope, email: user.email, ip })

  return NextResponse.json({
    ok: true,
    maskedEmail:     maskEmail(user.email),
    cooldownSeconds: otpScopeConfig(scope).cooldownSeconds,
  })
}
