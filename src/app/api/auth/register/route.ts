import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/auth-utils'
import { sendVerificationEmail } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail, validatePhone, validatePasswordStrength, getOriginFromRequest } from '@/lib/api-guard'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many registrations. Try again later.' }, { status: 429 })
  }

  const body     = await req.json().catch(() => ({}))
  const name     = sanitizeStr(body.name, 100)
  const email    = sanitizeStr(body.email, 254).toLowerCase()
  const phone    = sanitizeStr(body.phone, 30)
  const password = (body.password ?? '') as string

  if (!name || !email || !phone || !password)
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  if (!validateEmail(email))
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  if (!validatePhone(phone))
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  const strengthError = validatePasswordStrength(password)
  if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 })

  // If a fully verified account already exists — return ok silently (no enumeration)
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) return NextResponse.json({ ok: true })

  const passwordHash = await hashPassword(password)
  const token        = crypto.randomBytes(32).toString('hex')
  const expiresAt    = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Upsert pending registration — replaces any previous unverified attempt
  await prisma.pendingRegistration.upsert({
    where:  { email },
    update: { name, phone, passwordHash, token, expiresAt },
    create: { name, email, phone, passwordHash, token, expiresAt },
  })

  const origin = getOriginFromRequest(req)
  await sendVerificationEmail(email, name, token, origin).catch((err) =>
    console.error('Failed to send verification email:', err)
  )

  return NextResponse.json({ ok: true })
}
