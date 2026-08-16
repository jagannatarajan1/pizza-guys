import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth-utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validatePasswordStrength, getOriginFromRequest } from '@/lib/api-guard'
import { isPasswordReused, recordPasswordHistory } from '@/lib/password-history'
import { sendPasswordChangedEmail } from '@/lib/email'
import { logAuditEvent } from '@/lib/audit-log'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`reset-pw:${ip}`, 5, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body     = await req.json().catch(() => ({}))
  const token    = sanitizeStr(body.token, 128)
  const password = (body.password ?? '') as string

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const strengthError = validatePasswordStrength(password)
  if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken:   token,
      passwordResetExpires: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
  }

  if (await isPasswordReused(user.id, password, user.passwordHash)) {
    return NextResponse.json(
      { error: "You can't reuse a recent password. Please choose a different one." },
      { status: 400 }
    )
  }

  const passwordHash = await hashPassword(password)
  await recordPasswordHistory(user.id, user.passwordHash)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken:   null,
      passwordResetExpires: null,
      failedLogins:         0,
      lockedUntil:          null,
      // A reset is still a password change — other devices/sessions (e.g. an
      // attacker who prompted this reset) must not stay logged in.
      tokenVersion:         { increment: 1 },
      passwordChangedAt:    new Date(),
    },
  })

  await logAuditEvent({ userId: user.id, email: user.email, action: 'password_change_success', detail: 'via reset-password', ip })
  const origin = getOriginFromRequest(req)
  await sendPasswordChangedEmail(user.email, user.name, origin).catch((err) =>
    console.error('Failed to send password-changed email:', err)
  )

  // Auto-login after reset
  const sessionToken = signToken({ userId: user.id, role: user.role, email: user.email, tokenVersion: updated.tokenVersion })
  const res = NextResponse.json({ ok: true })
  setAuthCookie(res, sessionToken, req)
  return res
}
