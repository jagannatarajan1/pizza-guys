import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ ok: false, reason: 'missing' })
  }

  const user = await prisma.user.findUnique({ where: { pendingEmailToken: token } })
  if (!user || !user.pendingEmail) {
    return NextResponse.json({ ok: false, reason: 'invalid' })
  }

  if (!user.pendingEmailExpires || user.pendingEmailExpires <= new Date()) {
    return NextResponse.json({ ok: false, reason: 'expired' })
  }

  // Someone else may have registered the new address in the meantime.
  const conflict = await prisma.user.findUnique({ where: { email: user.pendingEmail } })
  if (conflict && conflict.id !== user.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingEmail: null, pendingEmailToken: null, pendingEmailExpires: null },
    })
    return NextResponse.json({ ok: false, reason: 'taken' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email:               user.pendingEmail,
      pendingEmail:        null,
      pendingEmailToken:   null,
      pendingEmailExpires: null,
    },
  })

  return NextResponse.json({ ok: true })
}
