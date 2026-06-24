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

  const { id }  = await params
  const { name, icon, visible, order } = await req.json()

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name    !== undefined && { name }),
      ...(icon    !== undefined && { icon }),
      ...(visible !== undefined && { visible }),
      ...(order   !== undefined && { order }),
    },
  })
  return NextResponse.json({ category })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { id } = await params
  await prisma.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
