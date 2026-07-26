import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'
import { validatePostcode } from '@/lib/api-guard'

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await ctx.params
  const { label, line1, line2, city, postcode, notes, isDefault } = await req.json()

  if (postcode !== undefined && !validatePostcode(postcode)) {
    return NextResponse.json({ error: 'Enter a valid UK postcode (e.g. SW1A 1AA)' }, { status: 400 })
  }

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

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await ctx.params

  await prisma.address.deleteMany({
    where: { id, userId: payload.userId },
  })

  return NextResponse.json({ ok: true })
}
