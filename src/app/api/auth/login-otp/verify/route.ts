import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { signToken, setAuthCookie, signTwoFactorTempToken, verifyLoginOtpTempToken } from '@/lib/auth-utils'
import { rateLimitMulti, getClientIp } from '@/lib/rate-limit'
import { redeemLoginOtp, otpVerifyLimits, isStaffRole, describeRedeemFailure, type OtpScope } from '@/lib/login-otp'

// The dedicated backend verification endpoint every login now passes through.
// Requires a tempToken minted by /api/auth/login (i.e. the password was
// already verified for this exact user) — there is no way to reach this
// endpoint, or the session it grants, with an email/code pair alone.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req as unknown as Request)

  const body      = await req.json().catch(() => ({}))
  const tempToken = (body.tempToken ?? '') as string
  const code      = ((body.code ?? '') as string).trim()

  if (!tempToken) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
  }

  const claim = verifyLoginOtpTempToken(tempToken)
  if (!claim) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  // The email/scope this code must match come from the database via the
  // token's userId — never from anything the client sent alongside the code.
  const user = await prisma.user.findUnique({ where: { id: claim.userId } })
  if (!user) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  const scope: OtpScope = isStaffRole(user.role) ? 'admin' : 'user'

  const limited = rateLimitMulti(otpVerifyLimits(scope, user.email, ip))
  if (limited.limited) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const result = await redeemLoginOtp({ scope, email: user.email, code, ip })
  if (!result.ok) {
    return NextResponse.json({ error: describeRedeemFailure(result.reason) }, { status: 400 })
  }

  const redeemed = result.user

  // Staff account with authenticator-app 2FA set up → this OTP only proved
  // the emailed-code factor; the existing TOTP step is unchanged and still
  // required before a session is granted.
  if (isStaffRole(redeemed.role) && redeemed.twoFactorEnabled) {
    return NextResponse.json({ requires2FA: true, tempToken: signTwoFactorTempToken(redeemed.id) })
  }

  const sessionToken = signToken({ userId: redeemed.id, email: redeemed.email, role: redeemed.role, tokenVersion: redeemed.tokenVersion })
  const res = NextResponse.json({
    user: { id: redeemed.id, name: redeemed.name, email: redeemed.email, phone: redeemed.phone, role: redeemed.role, addresses: redeemed.addresses },
    // Staff account with no authenticator app set up yet → same nag as before.
    ...(isStaffRole(redeemed.role) && !redeemed.twoFactorEnabled ? { mustSetup2FA: true } : {}),
  })
  setAuthCookie(res, sessionToken, req)
  return res
}
