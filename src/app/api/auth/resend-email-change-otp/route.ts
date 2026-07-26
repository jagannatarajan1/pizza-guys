import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmailChangeOtp } from '@/lib/email'
import { generateOtp, hashOtp } from '@/lib/otp'
import { logAuditEvent } from '@/lib/audit-log'

const OTP_TTL_MINUTES = 8

export async function POST(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ip = getClientIp(req as unknown as Request)
  // Tighter than the initial request — this is purely "send me another code".
  const rl = rateLimit(`resend-email-otp:${payload.userId}`, 3, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Please wait before requesting another code (try again in ${Math.ceil(rl.retryAfter / 60)} minute(s)).` },
      { status: 429 }
    )
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user?.pendingEmail) {
    return NextResponse.json({ error: 'No pending email change found. Start again from your account settings.' }, { status: 400 })
  }

  const otp       = generateOtp()
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { pendingEmailOtpHash: hashOtp(otp), pendingEmailOtpExpires: expiresAt, pendingEmailAttempts: 0 },
  })

  await logAuditEvent({ userId: user.id, email: user.email, action: 'email_change_requested', detail: `resend to ${user.pendingEmail}`, ip })

  await sendEmailChangeOtp(user.pendingEmail, user.name, otp, OTP_TTL_MINUTES).catch((err) =>
    console.error('Failed to resend email change OTP:', err)
  )

  return NextResponse.json({ ok: true, expiresInMinutes: OTP_TTL_MINUTES })
}
