import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'
import { generateSecret, generateQRCode, generateBackupCodes, hashBackupCodes, verifyTOTP } from '@/lib/totp'

// GET — generate a new secret + QR code (not saved yet)
export async function GET(req: NextRequest) {
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Generate a new temporary secret (stored only after user confirms it works)
  const secret = generateSecret()
  const qrCode = await generateQRCode(user.email, secret)

  // Save the secret temporarily — it becomes "active" only after POST verify
  await prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret } })

  return NextResponse.json({ secret, qrCode })
}

// POST — confirm the TOTP code works, enable 2FA, return backup codes
export async function POST(req: NextRequest) {
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user?.twoFactorSecret) {
    return NextResponse.json({ error: 'No secret found — call GET first' }, { status: 400 })
  }

  if (!verifyTOTP(String(code), user.twoFactorSecret)) {
    return NextResponse.json({ error: 'Invalid code — check your authenticator app' }, { status: 400 })
  }

  const backupCodes  = generateBackupCodes()
  const hashedBackup = await hashBackupCodes(backupCodes)

  await prisma.user.update({
    where: { id: user.id },
    data:  { twoFactorEnabled: true, twoFactorBackup: hashedBackup },
  })

  return NextResponse.json({ success: true, backupCodes })
}

// DELETE — disable 2FA (requires valid TOTP)
export async function DELETE(req: NextRequest) {
  const token   = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { code } = await req.json()
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
    return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 })
  }

  if (!verifyTOTP(String(code), user.twoFactorSecret)) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackup: '[]' },
  })

  return NextResponse.json({ success: true })
}
