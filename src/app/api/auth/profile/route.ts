import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'

export async function PUT(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { name, phone } = await req.json()

  await prisma.user.update({
    where: { id: payload.userId },
    data: { name: name ?? undefined, phone: phone ?? undefined },
  })

  return NextResponse.json({ ok: true })
}
