import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth-utils'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const ADMIN_ROLES  = ['admin', 'staff', 'viewer']
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  // 10 login attempts per IP per 15 minutes
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const body       = await req.json().catch(() => ({}))
  const identifier = ((body.email ?? '') as string).trim().toLowerCase()
  const password   = (body.password ?? '') as string

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where:   { OR: [{ email: identifier }, { phone: identifier }] },
    include: { addresses: { orderBy: { isDefault: 'desc' } } },
  })

  // Account locked?
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return NextResponse.json(
      { error: `Account locked. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.` },
      { status: 423 }
    )
  }

  const valid = user && await verifyPassword(password, user.passwordHash)

  if (!valid) {
    if (user) {
      const attempts = (user.failedLogins ?? 0) + 1
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: attempts,
          lockedUntil:  attempts >= MAX_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : null,
        },
      })
    }
    // Same error for both "user not found" and "wrong password" — prevents user enumeration
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  // Reset failed attempts on successful password check
  if (user.failedLogins > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data:  { failedLogins: 0, lockedUntil: null },
    })
  }

  // Admin with 2FA enabled → issue short-lived temp token, client must submit TOTP next
  if (ADMIN_ROLES.includes(user.role) && user.twoFactorEnabled) {
    const tempToken = jwt.sign(
      { userId: user.id, phase: '2fa' },
      process.env.AUTH_SECRET!,
      { expiresIn: '5m' }
    )
    return NextResponse.json({ requires2FA: true, tempToken })
  }

  // Admin without 2FA → log in but flag that setup is required
  if (ADMIN_ROLES.includes(user.role) && !user.twoFactorEnabled) {
    const token = signToken({ userId: user.id, email: user.email, role: user.role })
    const res   = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, addresses: user.addresses },
      mustSetup2FA: true,
    })
    setAuthCookie(res, token)
    return res
  }

  // Regular customer → full login immediately
  const token = signToken({ userId: user.id, email: user.email, role: user.role })
  const res   = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, addresses: user.addresses },
  })
  setAuthCookie(res, token)
  return res
}
