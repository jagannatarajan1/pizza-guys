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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { id } = await params
  const { name, description, required, multiSelect, min, max, maxPerOption } = await req.json()

  const group = await prisma.modifierGroup.update({
    where: { id },
    data: {
      name, required: !!required, multiSelect: !!multiSelect,
      min: min ?? 0, max: max ?? 1,
      // Only written when the caller actually sent them, so editing a group's
      // name from the admin screen can't blank out the step wording or the
      // per-option limit it doesn't yet have a field for.
      ...(typeof description === 'string' ? { description } : {}),
      ...(maxPerOption !== undefined ? { maxPerOption: Math.max(1, Number(maxPerOption) || 1) } : {}),
    },
    include: { options: true },
  })

  return NextResponse.json({ group })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const { id } = await params
  await prisma.modifierGroup.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
