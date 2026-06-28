import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

function superAdminOnly(req: NextRequest) {
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return payload
}

// Update role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = superAdminOnly(req)
  if (payload instanceof NextResponse) return payload

  const { id }   = await params
  const { role } = await req.json()

  if (!['admin', 'staff', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where:  { id },
    data:   { role },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json({ user })
}

// Remove staff access (downgrade to regular user)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = superAdminOnly(req)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  // Cannot remove your own admin access
  if (typeof payload === 'object' && 'userId' in payload && payload.userId === id) {
    return NextResponse.json({ error: 'Cannot remove your own access' }, { status: 400 })
  }

  await prisma.user.update({ where: { id }, data: { role: 'user' } })
  return NextResponse.json({ ok: true })
}
