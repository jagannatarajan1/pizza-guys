import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth-utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr } from '@/lib/api-guard'

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

  if (password.length < 8 || password.length > 128)
    return NextResponse.json({ error: 'Password must be 8–128 characters' }, { status: 400 })
  if (!/[A-Z]/.test(password))
    return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 })
  if (!/[0-9]/.test(password))
    return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 })

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken:   token,
      passwordResetExpires: { gt: new Date() },
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken:   null,
      passwordResetExpires: null,
      failedLogins:         0,
      lockedUntil:          null,
    },
  })

  // Auto-login after reset
  const sessionToken = signToken({ userId: user.id, role: user.role, email: user.email })
  const res = NextResponse.json({ ok: true })
  setAuthCookie(res, sessionToken)
  return res
}
