import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, maskEmail } from '@/lib/auth-utils'
import { sendSignupOtpEmail } from '@/lib/email'
import { generateOtp, hashOtp, otpExpiryDate, OTP_EXPIRES_MINUTES } from '@/lib/otp'
import { rateLimit, rateLimitMulti, getClientIp, limitKeyPart } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail, validatePhone, validatePasswordStrength } from '@/lib/api-guard'
import { logAuditEvent } from '@/lib/audit-log'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many registrations. Try again later.' }, { status: 429 })
  }

  const body     = await req.json().catch(() => ({}))
  const name     = sanitizeStr(body.name, 100)
  // Normalize: trim + lowercase, so "A@B.com " and "a@b.com" are the same account.
  const email    = sanitizeStr(body.email, 254).toLowerCase()
  const phone    = sanitizeStr(body.phone, 30)
  const password = (body.password ?? '') as string

  if (!name || !email || !phone || !password)
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  if (!validateEmail(email))
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  if (!validatePhone(phone))
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  const strengthError = validatePasswordStrength(password)
  if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 })

  // A verified account with this email already exists — do not create a
  // second one. Unlike the old link-based flow, we now tell the caller
  // outright: they already went through this and just need to sign in.
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    await logAuditEvent({ email, action: 'signup_blocked_existing_account', ip })
    return NextResponse.json(
      { error: 'You already have an account. Please log in.', accountExists: true },
      { status: 409 }
    )
  }

  const passwordHash = await hashPassword(password)

  // 30s minimum gap between codes for the same address, independent of the
  // coarser per-IP registration limit above — mirrors the login-OTP cooldown.
  // Checked first and short-circuited, same reasoning as the login route:
  // resubmitting the form within the cooldown must never spend the (much
  // smaller) request-limit budget for an email that was never going to be
  // sent again.
  const cooldownKey = `signup-otp-cool:${limitKeyPart(email)}`
  const cooldown = rateLimit(cooldownKey, 1, 30 * 1000)
  if (!cooldown.limited) {
    const requestLimited = rateLimitMulti([
      { key: `signup-otp-req:email:${limitKeyPart(email)}`, limit: 5,  windowMs: 15 * 60 * 1000 },
      { key: `signup-otp-req:ip:${ip}`,                     limit: 15, windowMs: 15 * 60 * 1000 },
    ])
    if (requestLimited.limited) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const otp = generateOtp()
    // Upsert pending registration — replaces (and invalidates) any previous
    // unverified attempt/code for this address.
    await prisma.pendingRegistration.upsert({
      where:  { email },
      update: { name, phone, passwordHash, otpHash: hashOtp(otp), otpExpires: otpExpiryDate(), otpAttempts: 0 },
      create: { name, email, phone, passwordHash, otpHash: hashOtp(otp), otpExpires: otpExpiryDate(), otpAttempts: 0 },
    })

    await logAuditEvent({ email, action: 'signup_otp_requested', ip })

    // Not awaited — see sendLoginOtpEmail for why (avoids a timing oracle and
    // lets a mail outage not fail the request the code was already committed for).
    void sendSignupOtpEmail(email, name, otp, OTP_EXPIRES_MINUTES).catch((err) =>
      console.error('Failed to send signup verification email:', err)
    )
  }

  return NextResponse.json({ ok: true, requiresOtp: true, email, maskedEmail: maskEmail(email), cooldownSeconds: 30 })
}
