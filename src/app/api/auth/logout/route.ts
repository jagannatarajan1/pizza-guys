import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  // Passing the request through means the expiry cookie carries the same
  // Secure flag the original was set with, which is what actually makes the
  // browser drop it rather than quietly keep the old one.
  clearAuthCookie(res, req)
  return res
}
