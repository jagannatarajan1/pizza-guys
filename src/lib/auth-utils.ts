import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'

const SECRET = process.env.AUTH_SECRET!
const COOKIE = 'pg_token'

export type JWTPayload = { userId: string; email: string; role: string; tokenVersion: number }

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

// Full session check: verifies the JWT itself, then confirms its embedded
// tokenVersion still matches the database. A password change bumps the
// database value, which makes every token issued before that moment fail
// this check on its very next request — that's the entire mechanism behind
// "log out every other device" for an otherwise stateless JWT.
export async function getSessionPayload(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  })
  if (!user || user.tokenVersion !== payload.tokenVersion) return null

  return payload
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
