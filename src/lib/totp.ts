import { generateSecret as otpGenerateSecret, generateSync, verifySync, generateURI } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export function generateSecret() {
  return otpGenerateSecret({ length: 20 })
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret, epochTolerance: 1 })
    return typeof result === 'object' ? result.valid : Boolean(result)
  } catch {
    return false
  }
}

export function generateTokenForTest(secret: string): string {
  return generateSync({ secret })
}

export async function generateQRCode(email: string, secret: string, appName = 'Pizza Guys') {
  const otpauth = generateURI({ issuer: appName, label: email, secret })
  return QRCode.toDataURL(otpauth)
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex').toUpperCase())
}

export async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashed = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)))
  return JSON.stringify(hashed)
}

export async function verifyBackupCode(code: string, hashedJson: string): Promise<number> {
  const hashed: string[] = JSON.parse(hashedJson || '[]')
  for (let i = 0; i < hashed.length; i++) {
    if (await bcrypt.compare(code.toUpperCase(), hashed[i])) return i
  }
  return -1
}
