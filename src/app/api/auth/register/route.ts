import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const { name, email, phone, password } = await req.json()

  if (!name || !email || !phone || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash },
  })

  const token = signToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  setAuthCookie(res, token)
  return res
}
