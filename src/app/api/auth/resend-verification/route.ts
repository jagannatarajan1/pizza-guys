import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`resend-verify:${ip}`, 3, 15 * 60 * 1000) // 3 per 15 min
  if (rl.limited) {
    return NextResponse.json({ error: `Too many requests. Try again in ${rl.retryAfter}s.` }, { status: 429 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to prevent email enumeration
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true })
  }

  const emailVerifyToken   = crypto.randomBytes(32).toString('hex')
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data:  { emailVerifyToken, emailVerifyExpires },
  })

  await sendVerificationEmail(user.email, user.name, emailVerifyToken).catch((err) =>
    console.error('Failed to resend verification email:', err)
  )

  return NextResponse.json({ ok: true })
}
