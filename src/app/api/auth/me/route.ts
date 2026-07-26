import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSessionPayload } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload) return NextResponse.json({ user: null })

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { addresses: { orderBy: { isDefault: 'desc' } } },
  })

  if (!user) return NextResponse.json({ user: null })

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      addresses: user.addresses,
    },
  })
}
