import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export async function PUT(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { name, phone } = await req.json()

  await prisma.user.update({
    where: { id: payload.userId },
    data: { name: name ?? undefined, phone: phone ?? undefined },
  })

  return NextResponse.json({ ok: true })
}
