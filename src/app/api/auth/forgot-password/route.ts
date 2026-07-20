import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail, getOriginFromRequest } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ ok: true }) // silent limit — don't reveal rate limiting
  }

  const body  = await req.json().catch(() => ({}))
  const email = sanitizeStr(body.email, 254).toLowerCase()

  if (!email || !validateEmail(email)) {
    return NextResponse.json({ ok: true }) // always ok — no enumeration
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Only send if user exists and is a regular user (not staff/admin via this flow)
  if (user && user.role === 'user') {
    const token   = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordResetToken: token, passwordResetExpires: expires },
    })

    const origin = getOriginFromRequest(req)
    await sendPasswordResetEmail(user.email, user.name, token, origin).catch((err) =>
      console.error('Failed to send password reset email:', err)
    )
  }

  return NextResponse.json({ ok: true })
}
