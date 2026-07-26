import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'

async function adminOnly(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; optId: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { optId } = await params
  const { name, price } = await req.json()

  const option = await prisma.modifierOption.update({
    where: { id: optId },
    data: { name, price: Math.round((price ?? 0) * 100) },
  })

  return NextResponse.json({ option: { ...option, price: option.price / 100 } })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; optId: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { optId } = await params
  await prisma.modifierOption.delete({ where: { id: optId } })
  return NextResponse.json({ ok: true })
}
