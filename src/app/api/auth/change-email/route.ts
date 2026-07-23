import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'
import { sendEmailChangeVerification } from '@/lib/email'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sanitizeStr, validateEmail, getOriginFromRequest } from '@/lib/api-guard'

// Starts an email change — the account's real email is untouched until the
// link sent to the NEW address is clicked (see verify-email-change/route.ts).
export async function POST(req: NextRequest) {
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const ip = getClientIp(req as unknown as Request)
  const rl = rateLimit(`change-email:${payload.userId}:${ip}`, 5, 60 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const body     = await req.json().catch(() => ({}))
  const newEmail = sanitizeStr(body.newEmail, 254).toLowerCase()

  if (!newEmail || !validateEmail(newEmail)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  if (newEmail === user.email) {
    return NextResponse.json({ error: 'That is already your current email address' }, { status: 400 })
  }

  const taken = await prisma.user.findUnique({ where: { email: newEmail } })
  if (taken) {
    // Same "pretend it worked" response as registration — don't reveal
    // whether an email is already in use on the site.
    return NextResponse.json({ ok: true })
  }

  const changeToken = crypto.randomBytes(32).toString('hex')
  const expiresAt    = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.user.update({
    where: { id: user.id },
    data: {
      pendingEmail:        newEmail,
      pendingEmailToken:   changeToken,
      pendingEmailExpires: expiresAt,
    },
  })

  const origin = getOriginFromRequest(req)
  await sendEmailChangeVerification(newEmail, user.name, changeToken, origin).catch((err) =>
    console.error('Failed to send email change verification:', err)
  )

  return NextResponse.json({ ok: true })
}
