import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { maskEmail } from '@/lib/auth-utils'
import { sendSignupOtpEmail } from '@/lib/email'
import { generateOtp, hashOtp, otpExpiryDate, OTP_EXPIRES_MINUTES } from '@/lib/otp'
import { rateLimit, rateLimitMulti, getClientIp, limitKeyPart } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit-log'

const COOLDOWN_SECONDS = 30

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  const body  = await req.json().catch(() => ({}))
  const email = sanitizeStr(body.email, 254).toLowerCase()
  if (!email || !validateEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Server-enforced cooldown — the frontend timer is cosmetic only. Consumed
  // on the typed address before any database lookup, same as the login-OTP
  // cooldown, so an unknown address is throttled identically to a real one.
  const cooldownKey = `signup-otp-cool:${limitKeyPart(email)}`
  const cooldown = rateLimit(cooldownKey, 1, COOLDOWN_SECONDS * 1000)
  if (cooldown.limited) {
    return NextResponse.json(
      { error: 'Please wait before requesting another code.', retryAfter: cooldown.retryAfter },
      { status: 429 }
    )
  }

  const requestLimited = rateLimitMulti([
    { key: `signup-otp-req:email:${limitKeyPart(email)}`, limit: 5,  windowMs: 15 * 60 * 1000 },
    { key: `signup-otp-req:ip:${ip}`,                     limit: 15, windowMs: 15 * 60 * 1000 },
  ])
  if (requestLimited.limited) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } })

  if (pending) {
    const otp = generateOtp()
    await prisma.pendingRegistration.update({
      where: { email },
      data:  { otpHash: hashOtp(otp), otpExpires: otpExpiryDate(), otpAttempts: 0 },
    })
    await logAuditEvent({ email, action: 'signup_otp_requested', detail: 'resend', ip })
    void sendSignupOtpEmail(email, pending.name, otp, OTP_EXPIRES_MINUTES).catch((err) =>
      console.error('resend-verification email failed:', err)
    )
  }

  // Same reply whether or not a pending registration exists for this address —
  // no enumeration signal from the resend endpoint either.
  return NextResponse.json({ ok: true, maskedEmail: maskEmail(email), cooldownSeconds: COOLDOWN_SECONDS })
}
