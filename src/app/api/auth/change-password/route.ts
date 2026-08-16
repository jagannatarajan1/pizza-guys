import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, verifyPassword, signToken, setAuthCookie, getSessionPayload } from '@/lib/auth-utils'
import { validatePasswordStrength, getOriginFromRequest } from '@/lib/api-guard'
import { isPasswordReused, recordPasswordHistory } from '@/lib/password-history'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendPasswordChangedEmail } from '@/lib/email'
import { logAuditEvent } from '@/lib/audit-log'

export async function POST(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ip = getClientIp(req as unknown as Request)
  // Keyed by user, not IP — switching networks must not reset the counter.
  const rl = rateLimit(`change-password:${payload.userId}`, 5, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} minute(s).` },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const currentPassword = (body.currentPassword ?? '') as string
  const newPassword     = (body.newPassword ?? '') as string
  const confirmPassword = (body.confirmPassword ?? '') as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'New password and confirmation do not match' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const currentValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!currentValid) {
    await logAuditEvent({
      userId: user.id, email: user.email, action: 'password_change_failed',
      detail: 'incorrect current password', ip,
    })
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const strengthError = validatePasswordStrength(newPassword)
  if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 })

  if (await isPasswordReused(user.id, newPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "That password has been used recently. Please choose a password you haven't used before." },
      { status: 400 }
    )
  }

  const newHash = await hashPassword(newPassword)
  await recordPasswordHistory(user.id, user.passwordHash)

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      // Bumping this invalidates every token issued before this moment —
      // every other device is signed out and must log in again.
      tokenVersion: { increment: 1 },
      passwordChangedAt: new Date(),
    },
  })

  await logAuditEvent({ userId: user.id, email: user.email, action: 'password_change_success', detail: 'via account settings', ip })

  const origin = getOriginFromRequest(req)
  await sendPasswordChangedEmail(user.email, user.name, origin).catch((err) =>
    console.error('Failed to send password-changed email:', err)
  )

  // Re-sign a fresh token carrying the new tokenVersion so the device making
  // this request stays logged in — only every *other* session is kicked out.
  const sessionToken = signToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: updated.tokenVersion })
  const res = NextResponse.json({ ok: true })
  setAuthCookie(res, sessionToken, req)
  return res
}
