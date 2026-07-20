import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth-utils'

// Called via fetch() from the button-driven flow on /verify-email — see
// src/app/verify-email/page.tsx. Nothing else in the app links or fetches
// this route directly (the emailed link points at the /verify-email page,
// not here), so it's safe to respond with JSON instead of a redirect —
// that's what lets the frontend show an honest, specific failure reason
// instead of a generic "link expired" for every case.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ ok: false, reason: 'missing' })
  }

  const pending = await prisma.pendingRegistration.findFirst({ where: { token } })

  if (!pending) {
    // No pending row matches this token at all — it was never valid.
    // (We can't currently distinguish "already used to verify" from this,
    // since the pending row is deleted once verification succeeds.)
    return NextResponse.json({ ok: false, reason: 'invalid' })
  }

  if (pending.expiresAt <= new Date()) {
    return NextResponse.json({ ok: false, reason: 'expired' })
  }

  // Create the real user account now that email is confirmed
  const user = await prisma.user.create({
    data: {
      name:         pending.name,
      email:        pending.email,
      phone:        pending.phone,
      passwordHash: pending.passwordHash,
    },
  })

  // Remove the pending record
  await prisma.pendingRegistration.delete({ where: { id: pending.id } })

  // Auto-login
  const sessionToken = signToken({ userId: user.id, email: user.email, role: user.role })
  const res = NextResponse.json({ ok: true, redirectTo: '/dashboard?verified=1' })
  setAuthCookie(res, sessionToken)
  return res
}
