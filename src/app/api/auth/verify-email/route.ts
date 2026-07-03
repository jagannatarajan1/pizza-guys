import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing', req.nextUrl.origin))
  }

  const pending = await prisma.pendingRegistration.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
  })

  if (!pending) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', req.nextUrl.origin))
  }

  // Create the real user account now that email is confirmed
  const user = await prisma.user.create({
    data: {
      name:         pending.name,
      email:        pending.email,
      phone:        pending.phone,
      passwordHash: pending.passwordHash,
    },
  })

  // Remove the pending record
  await prisma.pendingRegistration.delete({ where: { id: pending.id } })

  // Auto-login
  const sessionToken = signToken({ userId: user.id, email: user.email, role: user.role })
  const res = NextResponse.redirect(new URL('/dashboard?verified=1', req.nextUrl.origin))
  setAuthCookie(res, sessionToken)
  return res
}
