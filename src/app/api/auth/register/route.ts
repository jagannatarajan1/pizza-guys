import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const { name, email, phone, password } = await req.json()

  if (!name || !email || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least one uppercase letter' }, { status: 400 })
  }
  if (!/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'Password must contain at least one number' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash },
  })

  const token = signToken({ userId: user.id, email: user.email, role: user.role })
  const res = NextResponse.json({ ok: true })
  setAuthCookie(res, token)
  return res
}
