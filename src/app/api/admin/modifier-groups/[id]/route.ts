import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

function adminOnly(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { id } = await params
  const { name, required, multiSelect, min, max } = await req.json()

  const group = await prisma.modifierGroup.update({
    where: { id },
    data: { name, required: !!required, multiSelect: !!multiSelect, min: min ?? 0, max: max ?? 1 },
    include: { options: true },
  })

  return NextResponse.json({ group })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { id } = await params
  await prisma.modifierGroup.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
