import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth-utils'
import { verifyOtp } from '@/lib/otp'
import { sanitizeStr, validateEmail } from '@/lib/api-guard'
import { rateLimitMulti, getClientIp, limitKeyPart } from '@/lib/rate-limit'
import { logAuditEvent } from '@/lib/audit-log'

const MAX_ATTEMPTS = 5

// Completes signup: exchanges the emailed 6-digit code for the real User row.
// Called from the OTP screen shown right after registering (or from the
// standalone /verify-email fallback page if someone comes back to it later).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  const body  = await req.json().catch(() => ({}))
  const email = sanitizeStr(body.email, 254).toLowerCase()
  const code  = sanitizeStr(body.code, 6)

  if (!email || !validateEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
  }

  const limited = rateLimitMulti([
    { key: `signup-otp-vfy:email:${limitKeyPart(email)}`, limit: 10, windowMs: 15 * 60 * 1000 },
    { key: `signup-otp-vfy:ip:${ip}`,                     limit: 20, windowMs: 15 * 60 * 1000 },
  ])
  if (limited.limited) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const pending = await prisma.pendingRegistration.findUnique({ where: { email } })

  if (!pending || !pending.otpHash || !pending.otpExpires) {
    return NextResponse.json(
      { error: 'No pending verification found for this email. Please sign up again.' },
      { status: 400 }
    )
  }

  if (pending.otpExpires <= new Date()) {
    return NextResponse.json(
      { error: 'This verification code has expired. Please request a new code.' },
      { status: 400 }
    )
  }

  if (pending.otpAttempts >= MAX_ATTEMPTS) {
    await prisma.pendingRegistration.update({
      where: { id: pending.id },
      data:  { otpHash: null, otpExpires: null, otpAttempts: 0 },
    })
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please request a new verification code.' },
      { status: 400 }
    )
  }

  if (!verifyOtp(code, pending.otpHash)) {
    const attempts  = pending.otpAttempts + 1
    await logAuditEvent({ email, action: 'signup_otp_failed', detail: `attempt ${attempts}`, ip })
    if (attempts >= MAX_ATTEMPTS) {
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data:  { otpHash: null, otpExpires: null, otpAttempts: 0 },
      })
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new verification code.' },
        { status: 400 }
      )
    }
    await prisma.pendingRegistration.update({ where: { id: pending.id }, data: { otpAttempts: attempts } })
    return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
  }

  // Correct code — create the real account. The email column's unique
  // constraint is the final backstop against a race with a second signup (or
  // a second verify) for the same address landing here at the same moment.
  let user
  try {
    user = await prisma.user.create({
      data: {
        name:         pending.name,
        email:        pending.email,
        phone:        pending.phone,
        passwordHash: pending.passwordHash,
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {})
      return NextResponse.json(
        { error: 'You already have an account. Please log in.', accountExists: true },
        { status: 409 }
      )
    }
    throw err
  }

  await prisma.pendingRegistration.delete({ where: { id: pending.id } }).catch(() => {})
  await logAuditEvent({ userId: user.id, email: user.email, action: 'signup_otp_verified', ip })

  const sessionToken = signToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion })
  const res = NextResponse.json({
    ok: true,
    redirectTo: '/dashboard?verified=1',
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, addresses: [] },
  })
  setAuthCookie(res, sessionToken, req)
  return res
}
