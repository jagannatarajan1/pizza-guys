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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { id: groupId } = await params
  const { name, price } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const maxOrder = await prisma.modifierOption.aggregate({
    where: { groupId },
    _max: { sortOrder: true },
  })

  const option = await prisma.modifierOption.create({
    data: {
      groupId,
      name,
      price: Math.round((price ?? 0) * 100),
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  })

  return NextResponse.json({ option: { ...option, price: option.price / 100 } }, { status: 201 })
}
