import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, getSessionPayload } from '@/lib/auth-utils'
import { sendEmailChangeOtp } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail } from '@/lib/api-guard'
import { generateOtp, hashOtp } from '@/lib/otp'
import { logAuditEvent } from '@/lib/audit-log'

const OTP_TTL_MINUTES = 8

// Starts an email change — the account's real email is untouched until the
// OTP sent to the NEW address is entered (see verify-email-change/route.ts).
export async function POST(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`change-email:${payload.userId}:${ip}`, 5, 60 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body            = await req.json().catch(() => ({}))
  const newEmail        = sanitizeStr(body.newEmail, 254).toLowerCase()
  const currentPassword = (body.currentPassword ?? '') as string

  // Changing the account email is sensitive enough (it's the recovery
  // channel) to require re-proving the password, not just a live cookie.
  if (!currentPassword) {
    return NextResponse.json({ error: 'Enter your current password to confirm this change' }, { status: 400 })
  }
  if (!newEmail || !validateEmail(newEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const passwordValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!passwordValid) {
    await logAuditEvent({ userId: user.id, email: user.email, action: 'email_change_failed', detail: 'incorrect password', ip })
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  if (newEmail === user.email) {
    return NextResponse.json({ error: 'That is already your current email address' }, { status: 400 })
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail } })
  if (taken) {
    // Unlike public registration, this caller is already authenticated, so
    // confirming the address is taken doesn't hand an attacker anything new.
    return NextResponse.json({ error: 'That email address is already registered' }, { status: 409 })
  }

  const otp       = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      pendingEmail: newEmail,
      pendingEmailOtpHash: hashOtp(otp),
      pendingEmailOtpExpires: expiresAt,
      pendingEmailAttempts: 0,
    },
  })

  await logAuditEvent({ userId: user.id, email: user.email, action: 'email_change_requested', detail: `to ${newEmail}`, ip })

  await sendEmailChangeOtp(newEmail, user.name, otp, OTP_TTL_MINUTES).catch((err) =>
    console.error('Failed to send email change OTP:', err)
  )

  return NextResponse.json({ ok: true, expiresInMinutes: OTP_TTL_MINUTES })
}
