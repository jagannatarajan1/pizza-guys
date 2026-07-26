import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload, hashPassword } from '@/lib/auth-utils'

async function superAdminOnly(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export const dynamic = 'force-dynamic'

// List all staff/admin users
export async function GET(req: NextRequest) {
  const deny = await superAdminOnly(req)
  if (deny) return deny

  const users = await prisma.user.findMany({
    where:   { role: { in: ['admin', 'staff', 'viewer'] } },
    select:  { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ users })
}

// Create a new staff user
export async function POST(req: NextRequest) {
  const deny = await superAdminOnly(req)
  if (deny) return deny

  const { name, email, password, role } = await req.json()

  if (!['staff', 'viewer', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password), role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json({ user })
}
