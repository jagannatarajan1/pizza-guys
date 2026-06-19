import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/addresses/[id]'>) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await ctx.params
  const { label, line1, line2, city, postcode, notes, isDefault } = await req.json()

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: payload.userId },
      data: { isDefault: false },
    })
  }

  await prisma.address.updateMany({
    where: { id, userId: payload.userId },
    data: {
      label: label ?? undefined,
      line1: line1 ?? undefined,
      line2: line2 ?? undefined,
      city: city ?? undefined,
      postcode: postcode ?? undefined,
      notes: notes ?? undefined,
      isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/addresses/[id]'>) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await ctx.params

  await prisma.address.deleteMany({
    where: { id, userId: payload.userId },
  })

  return NextResponse.json({ ok: true })
}
