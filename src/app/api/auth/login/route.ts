import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const identifier = (email ?? '').trim()

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Email/phone and password are required' }, { status: 400 })
  }

  // Accept email address OR mobile number
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { phone: identifier }] },
    include: { addresses: { orderBy: { isDefault: 'desc' } } },
  })

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid email/phone or password' }, { status: 401 })
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role })

  const res = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
    },
  })
  setAuthCookie(res, token)
  return res
}
