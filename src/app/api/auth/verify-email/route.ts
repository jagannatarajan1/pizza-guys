import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken:   token,
      emailVerifyExpires: { gt: new Date() },
      emailVerified:      false,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
  })

  // Auto-login after verification
  const sessionToken = signToken({ userId: user.id, email: user.email, role: user.role })
  const res = NextResponse.redirect(new URL('/dashboard?verified=1', req.nextUrl.origin))
  setAuthCookie(res, sessionToken)
  return res
}
