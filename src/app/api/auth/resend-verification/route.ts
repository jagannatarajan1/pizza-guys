import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail, getOriginFromRequest } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`resend-verify:${ip}`, 3, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ ok: true }) // silent — no enumeration
  }

  const body  = await req.json().catch(() => ({}))
  const email = sanitizeStr(body.email, 254).toLowerCase()
  if (!email || !validateEmail(email)) return NextResponse.json({ ok: true })

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } })

  if (pending) {
    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.pendingRegistration.update({
      where: { email },
      data:  { token, expiresAt },
    })
    const origin = getOriginFromRequest(req)
    await sendVerificationEmail(email, pending.name, token, origin).catch((err) =>
      console.error('resend-verification email failed:', err)
    )
  }

  return NextResponse.json({ ok: true })
}
