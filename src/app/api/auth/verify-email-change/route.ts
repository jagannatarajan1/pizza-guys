import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'
import { verifyOtp } from '@/lib/otp'
import { sanitizeStr, getOriginFromRequest } from '@/lib/api-guard'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmailChangedOldAddressNotice, sendEmailChangeConfirmedNewAddress } from '@/lib/email'
import { logAuditEvent } from '@/lib/audit-log'

const MAX_ATTEMPTS = 5

async function clearPending(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { pendingEmail: null, pendingEmailOtpHash: null, pendingEmailOtpExpires: null, pendingEmailAttempts: 0 },
  })
}

// Completes an email change once the user enters the code sent to the new
// address (see change-email/route.ts, which starts the process).
export async function POST(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`verify-email-otp:${payload.userId}`, 8, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const otp  = sanitizeStr(body.otp, 6)
  if (!otp) return NextResponse.json({ error: 'Enter the code we sent you' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (!user.pendingEmail || !user.pendingEmailOtpHash || !user.pendingEmailOtpExpires) {
    return NextResponse.json({ error: 'No pending email change found. Start again from your account settings.' }, { status: 400 })
  }

  if (user.pendingEmailOtpExpires <= new Date()) {
    // Keep pendingEmail intact — the user should be able to hit "resend"
    // rather than re-enter their password and the new address from scratch.
    return NextResponse.json({ error: 'This code has expired. Request a new one.' }, { status: 400 })
  }

  if (user.pendingEmailAttempts >= MAX_ATTEMPTS) {
    await clearPending(user.id)
    return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 400 })
  }

  if (!verifyOtp(otp, user.pendingEmailOtpHash)) {
    const attempts  = user.pendingEmailAttempts + 1
    const remaining = MAX_ATTEMPTS - attempts
    await logAuditEvent({ userId: user.id, email: user.email, action: 'email_change_failed', detail: 'incorrect otp', ip })

    if (remaining <= 0) {
      await clearPending(user.id)
      return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 400 })
    }
    await prisma.user.update({ where: { id: user.id }, data: { pendingEmailAttempts: attempts } })
    return NextResponse.json({ error: `Incorrect code. ${remaining} attempt(s) remaining.` }, { status: 400 })
  }

  const newEmail = user.pendingEmail

  // Someone else may have registered the new address while this was pending.
  const conflict = await prisma.user.findUnique({ where: { email: newEmail } })
  if (conflict && conflict.id !== user.id) {
    await clearPending(user.id)
    return NextResponse.json({ error: 'That email address was registered by someone else in the meantime.' }, { status: 409 })
  }

  const oldEmail = user.email
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: newEmail,
      pendingEmail: null,
      pendingEmailOtpHash: null,
      pendingEmailOtpExpires: null,
      pendingEmailAttempts: 0,
    },
  })

  await logAuditEvent({ userId: user.id, email: newEmail, action: 'email_change_verified', detail: `from ${oldEmail}`, ip })

  const origin = getOriginFromRequest(req)
  await sendEmailChangedOldAddressNotice(oldEmail, user.name, newEmail, origin).catch((err) =>
    console.error('Failed to notify old email address:', err)
  )
  await sendEmailChangeConfirmedNewAddress(newEmail, user.name).catch((err) =>
    console.error('Failed to send new-email confirmation:', err)
  )

  return NextResponse.json({ ok: true, email: newEmail })
}
