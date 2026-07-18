import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const SECRET = process.env.AUTH_SECRET!
const COOKIE = 'pg_token'

export type JWTPayload = { userId: string; email: string; role: string }

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12)
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
}

export { COOKIE as AUTH_COOKIE }
