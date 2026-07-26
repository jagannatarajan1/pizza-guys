import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import { signToken, setAuthCookie } from '@/lib/auth-utils'
import { verifyTOTP, verifyBackupCode } from '@/lib/totp'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  // 5 TOTP attempts per IP per 5 minutes (stricter than password)
  const rl = rateLimit(`2fa:${ip}`, 5, 5 * 60 * 1000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter}s.` },
      { status: 429 }
    )
  }

  const { tempToken, code } = await req.json()
  if (!tempToken || !code) {
    return NextResponse.json({ error: 'Missing token or code' }, { status: 400 })
  }

  // Verify the short-lived temp token from the password step
  let payload: { userId: string; phase: string }
  try {
    payload = jwt.verify(tempToken, process.env.AUTH_SECRET!) as typeof payload
  } catch {
    return NextResponse.json({ error: 'Session expired — please log in again' }, { status: 401 })
  }

  if (payload.phase !== '2fa') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where:   { id: payload.userId },
    include: { addresses: { orderBy: { isDefault: 'desc' } } },
  })

  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const codeStr = String(code).replace(/\s/g, '')
  let valid     = verifyTOTP(codeStr, user.twoFactorSecret)

  // Try backup code if TOTP fails
  if (!valid && codeStr.length === 8) {
    const idx = await verifyBackupCode(codeStr, user.twoFactorBackup)
    if (idx >= 0) {
      // Invalidate the used backup code
      const codes: string[] = JSON.parse(user.twoFactorBackup)
      codes.splice(idx, 1)
      await prisma.user.update({ where: { id: user.id }, data: { twoFactorBackup: JSON.stringify(codes) } })
      valid = true
    }
  }

  if (!valid) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 })
  }

  // Issue full session token
  const sessionToken = signToken({ userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion })
  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, addresses: user.addresses },
  })
  setAuthCookie(res, sessionToken)
  return res
}
