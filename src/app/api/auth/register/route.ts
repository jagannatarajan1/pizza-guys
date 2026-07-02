import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth-utils'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail, validatePhone } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many registrations. Try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const name     = sanitizeStr(body.name, 100)
  const email    = sanitizeStr(body.email, 254).toLowerCase()
  const phone    = sanitizeStr(body.phone, 30)
  const password = (body.password ?? '') as string

  if (!name || !email || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (!validateEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (!validatePhone(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Password must be 8–128 characters' }, { status: 400 })
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 })
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })

  // If already registered but unverified — resend the link silently
  if (existing && !existing.emailVerified) {
    const emailVerifyToken   = crypto.randomBytes(32).toString('hex')
    const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.user.update({ where: { id: existing.id }, data: { emailVerifyToken, emailVerifyExpires } })
    await sendVerificationEmail(existing.email, existing.name, emailVerifyToken).catch(() => null)
    return NextResponse.json({ ok: true })
  }

  // If already fully registered — return success without revealing it (prevents enumeration)
  if (existing) {
    return NextResponse.json({ ok: true })
  }

  const passwordHash       = await hashPassword(password)
  const emailVerifyToken   = crypto.randomBytes(32).toString('hex')
  const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, emailVerifyToken, emailVerifyExpires },
  })

  await sendVerificationEmail(user.email, user.name, emailVerifyToken).catch((err) =>
    console.error('Failed to send verification email:', err)
  )

  return NextResponse.json({ ok: true })
}
