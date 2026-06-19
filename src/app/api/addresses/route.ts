import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { label, line1, line2, city, postcode, notes, isDefault } = await req.json()

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: payload.userId },
      data: { isDefault: false },
    })
  }

  const address = await prisma.address.create({
    data: {
      userId: payload.userId,
      label: label ?? '',
      line1: line1 ?? '',
      line2: line2 ?? '',
      city: city ?? '',
      postcode: postcode ?? '',
      notes: notes ?? '',
      isDefault: Boolean(isDefault),
    },
  })

  return NextResponse.json({ address })
}
