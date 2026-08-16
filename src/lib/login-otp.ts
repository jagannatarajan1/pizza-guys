import prisma from './prisma'
import { generateOtp, hashOtp, verifyOtp, otpExpiryDate, OTP_EXPIRES_MINUTES } from './otp'
import { sendLoginOtpEmail } from './email'
import { rateLimitMulti, limitKeyPart, type LimitRule } from './rate-limit'
import { logAuditEvent } from './audit-log'

// Passwordless sign-in by emailed one-time code, shared by the customer door
// (/api/auth/otp/*) and the staff door (/api/auth/admin-otp/*). Both doors run
// exactly the same code path with a different `scope`, so a hardening fix can
// never accidentally land on one and miss the other.
//
// Design rules this file exists to enforce:
//   • the plain code never leaves this process except inside the email body —
//     it is never logged, never returned in a response, never put in a URL;
//   • only an HMAC of the code is stored (see otp.ts), so a database dump on
//     its own can't be turned back into working codes;
//   • every reply to "send me a code" is byte-identical whether or not the
//     address belongs to a real (or eligible) account;
//   • whether an account is allowed through the staff door is decided here,
//     on the server, from the role stored in the database — never from
//     anything the browser sent.

export type OtpScope = 'user' | 'admin'

// Roles that may use the staff door at all. Mirrors the ADMIN_ROLES list in
// the password login route.
const STAFF_ROLES = ['admin', 'staff', 'viewer']

// Wording is intentionally identical for "we emailed you" and "that address
// isn't one we'd email", and for every possible way a code can be rejected.
export const GENERIC_REQUEST_MESSAGE = 'If the account is eligible, a code has been sent.'
export const GENERIC_VERIFY_ERROR    = 'That code is not valid or has expired. Request a new one.'

type ScopeConfig = {
  /** Wrong guesses allowed against a single code before the code is destroyed. */
  maxAttempts: number
  /** Minimum gap between two codes for the same address, in seconds. */
  cooldownSeconds: number
  request: { perEmail: LimitRule['limit']; perEmailWindowMs: number; perIp: number; perIpWindowMs: number; global: number; globalWindowMs: number }
  verify:  { perEmail: LimitRule['limit']; perEmailWindowMs: number; perIp: number; perIpWindowMs: number }
}

const MINUTE = 60 * 1000

const CONFIG: Record<OtpScope, ScopeConfig> = {
  // Customer door — generous enough that a real person fumbling their inbox
  // isn't locked out, tight enough that the mailbox can't be flooded.
  user: {
    maxAttempts:     5,
    cooldownSeconds: 60,
    request: { perEmail: 4,  perEmailWindowMs: 15 * MINUTE, perIp: 12, perIpWindowMs: 15 * MINUTE, global: 200, globalWindowMs: 10 * MINUTE },
    verify:  { perEmail: 10, perEmailWindowMs: 15 * MINUTE, perIp: 20, perIpWindowMs: 15 * MINUTE },
  },
  // Staff door — a handful of real people use this, so the ceilings are much
  // lower and a wrong code is far more expensive.
  admin: {
    maxAttempts:     3,
    cooldownSeconds: 90,
    request: { perEmail: 3, perEmailWindowMs: 15 * MINUTE, perIp: 5,  perIpWindowMs: 15 * MINUTE, global: 30, globalWindowMs: 15 * MINUTE },
    verify:  { perEmail: 5, perEmailWindowMs: 15 * MINUTE, perIp: 10, perIpWindowMs: 15 * MINUTE },
  },
}

export function otpScopeConfig(scope: OtpScope) {
  return CONFIG[scope]
}

// Every bucket below is keyed on the address the caller *typed*, and is spent
// before we ever look in the database — so a real address and a made-up one
// are throttled identically and the throttling itself can't be used to probe
// for accounts. Pairing the per-address bucket with the per-IP bucket is what
// stops the two obvious evasions: rotating IPs against one account, and
// spraying many accounts from one IP.
export function otpRequestLimits(scope: OtpScope, email: string, ip: string): LimitRule[] {
  const c   = CONFIG[scope]
  const key = limitKeyPart(email)
  return [
    { key: `otp-req:${scope}:email:${key}`,   limit: c.request.perEmail, windowMs: c.request.perEmailWindowMs },
    { key: `otp-req:${scope}:ip:${ip}`,       limit: c.request.perIp,    windowMs: c.request.perIpWindowMs },
    { key: `otp-req:${scope}:global`,         limit: c.request.global,   windowMs: c.request.globalWindowMs },
  ]
}

export function otpVerifyLimits(scope: OtpScope, email: string, ip: string): LimitRule[] {
  const c   = CONFIG[scope]
  const key = limitKeyPart(email)
  return [
    { key: `otp-vfy:${scope}:email:${key}`, limit: c.verify.perEmail, windowMs: c.verify.perEmailWindowMs },
    { key: `otp-vfy:${scope}:ip:${ip}`,     limit: c.verify.perIp,    windowMs: c.verify.perIpWindowMs },
  ]
}

// Short gap between consecutive codes for the same address. Separate from the
// windowed limits above because the UI shows it as a live countdown, and
// because "wait a minute" and "you've had too many today" are different
// experiences for a legitimate user. Enforced on the typed address before any
// database lookup, so it behaves the same for unknown addresses.
export function otpCooldown(scope: OtpScope, email: string): { limited: boolean; retryAfter: number } {
  const c = CONFIG[scope]
  return rateLimitMulti([
    { key: `otp-cool:${scope}:${limitKeyPart(email)}`, limit: 1, windowMs: c.cooldownSeconds * 1000 },
  ])
}

// ── Expired-code housekeeping ────────────────────────────────────────────────
// Codes are already useless once `loginOtpExpires` passes, but leaving dead
// hashes on user rows forever is needless retention. Swept opportunistically
// (at most once every 5 minutes, whenever someone asks for a code) rather than
// on a timer, so it costs nothing on an idle server and needs no cron job.
let lastSweepAt = 0
const SWEEP_INTERVAL_MS = 5 * MINUTE

export async function sweepExpiredLoginOtps(): Promise<void> {
  const now = Date.now()
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return
  lastSweepAt = now

  await prisma.user
    .updateMany({
      where: { loginOtpExpires: { lt: new Date() } },
      data:  { loginOtpHash: null, loginOtpExpires: null, loginOtpAttempts: 0, loginOtpScope: null },
    })
    .catch(() => {})
}

// ── Issuing ──────────────────────────────────────────────────────────────────

/**
 * Create and email a fresh sign-in code, if (and only if) the address belongs
 * to an account that is allowed to use this door. Returns nothing at all — the
 * caller always replies with the same generic message, so nothing about the
 * outcome can leak back to the browser.
 *
 * Writing the new hash overwrites any previous one, which is what makes the
 * previous code stop working the moment a replacement is issued.
 */
export async function issueLoginOtp(params: {
  scope: OtpScope
  email: string
  ip: string
}): Promise<void> {
  const { scope, email, ip } = params

  await sweepExpiredLoginOtps()

  const user = await prisma.user
    .findUnique({
      where:  { email },
      select: { id: true, name: true, email: true, role: true, lockedUntil: true },
    })
    .catch(() => null)

  if (!user) return

  // The staff door is gated on the role held in the database. Nothing the
  // browser sends influences this, and a customer asking for a staff code
  // simply never receives one.
  if (scope === 'admin' && !STAFF_ROLES.includes(user.role)) return

  // A password-locked account must not become reachable just because there is
  // a second way in — otherwise the lockout is decorative.
  if (user.lockedUntil && user.lockedUntil > new Date()) return

  const otp = generateOtp()

  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginOtpHash:     hashOtp(otp),
      loginOtpExpires:  otpExpiryDate(),
      loginOtpAttempts: 0,
      loginOtpScope:    scope,
    },
  })

  await logAuditEvent({
    userId: user.id,
    email:  user.email,
    action: 'login_otp_requested',
    detail: `scope=${scope}`,
    ip,
  })

  // Deliberately not awaited: waiting for the mail server would make the reply
  // measurably slower for real accounts than for made-up ones, which is a
  // timing oracle that undoes the generic wording. The rejection is swallowed
  // (and never includes the code) so a mail outage can't crash the request.
  void sendLoginOtpEmail(user.email, user.name, otp, OTP_EXPIRES_MINUTES, scope === 'admin').catch(
    (err) => console.error('Failed to send login OTP email:', err?.message ?? err)
  )
}

// ── Redeeming ────────────────────────────────────────────────────────────────

export type RedeemedUser = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  tokenVersion: number
  twoFactorEnabled: boolean
  addresses: { id: string; label: string; line1: string; line2: string; city: string; postcode: string; notes: string; isDefault: boolean }[]
}

export type RedeemResult =
  | { ok: true; user: RedeemedUser }
  | { ok: false }

// Burn a code so it can never be used again, but only if it is still the code
// we think it is — the `loginOtpHash` in the WHERE clause turns this into a
// compare-and-set, so two requests racing with the same valid code result in
// exactly one winner.
async function burnCode(userId: string, expectedHash: string): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: { id: userId, loginOtpHash: expectedHash },
    data:  { loginOtpHash: null, loginOtpExpires: null, loginOtpAttempts: 0, loginOtpScope: null },
  })
  return result.count > 0
}

/**
 * Check a submitted code and, if it is genuinely correct, consume it and hand
 * back the account it belongs to. Every failure returns the same bare
 * `{ ok: false }` — the caller has no way to phrase a more specific error even
 * if it wanted to.
 */
export async function redeemLoginOtp(params: {
  scope: OtpScope
  email: string
  code: string
  ip: string
}): Promise<RedeemResult> {
  const { scope, email, code, ip } = params
  const maxAttempts = CONFIG[scope].maxAttempts

  const user = await prisma.user
    .findUnique({
      where: { email },
      include: { addresses: { orderBy: { isDefault: 'desc' } } },
    })
    .catch(() => null)

  if (!user) {
    // Spend roughly the same work as a real comparison so "unknown address"
    // isn't measurably faster than "known address, wrong code".
    verifyOtp(code, hashOtp('000000'))
    return { ok: false }
  }

  const fail = async (detail: string): Promise<RedeemResult> => {
    await logAuditEvent({ userId: user.id, email: user.email, action: 'login_otp_failed', detail: `scope=${scope} ${detail}`, ip })
    return { ok: false }
  }

  if (!user.loginOtpHash || !user.loginOtpExpires) return fail('no code outstanding')

  // A code minted at the customer door must not open the staff door, and the
  // reverse must not work either. Without this, the staff door's stricter
  // limits could be side-stepped by collecting the code from the softer one.
  if (user.loginOtpScope !== scope) return fail('wrong scope')

  if (user.loginOtpExpires <= new Date()) {
    await burnCode(user.id, user.loginOtpHash)
    return fail('expired')
  }

  if (user.loginOtpAttempts >= maxAttempts) {
    await burnCode(user.id, user.loginOtpHash)
    return fail('attempts exhausted')
  }

  // Re-check eligibility at redemption time, not just at issue time: a role
  // could have been revoked, or the account locked, in the minutes since the
  // code was emailed.
  if (scope === 'admin' && !STAFF_ROLES.includes(user.role)) {
    await burnCode(user.id, user.loginOtpHash)
    return fail('not eligible for staff login')
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) return fail('account locked')

  if (!verifyOtp(code, user.loginOtpHash)) {
    // Count the miss, then destroy the code if that was the last chance. Both
    // statements are conditional on the code still being the same one, so
    // parallel guesses can't reset or overshoot the counter.
    await prisma.user.updateMany({
      where: { id: user.id, loginOtpHash: user.loginOtpHash },
      data:  { loginOtpAttempts: { increment: 1 } },
    })
    await prisma.user.updateMany({
      where: { id: user.id, loginOtpHash: user.loginOtpHash, loginOtpAttempts: { gte: maxAttempts } },
      data:  { loginOtpHash: null, loginOtpExpires: null, loginOtpAttempts: 0, loginOtpScope: null },
    })
    return fail('incorrect code')
  }

  // Correct — claim it. If someone else claimed it a moment ago this returns
  // false and the login fails, which is exactly the single-use guarantee.
  const claimed = await burnCode(user.id, user.loginOtpHash)
  if (!claimed) return fail('code already used')

  // A successful sign-in clears the password-failure counter for the same
  // reason a successful password does: the owner has demonstrably shown up.
  if (user.failedLogins > 0) {
    await prisma.user
      .update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } })
      .catch(() => {})
  }

  await logAuditEvent({ userId: user.id, email: user.email, action: 'login_otp_success', detail: `scope=${scope}`, ip })

  return {
    ok: true,
    user: {
      id:               user.id,
      name:             user.name,
      email:            user.email,
      phone:            user.phone,
      // Read straight from the database row. This is the only place the new
      // session's role comes from, so a customer redeeming a code — at either
      // door — is issued a customer session and nothing else.
      role:             user.role,
      tokenVersion:     user.tokenVersion,
      twoFactorEnabled: user.twoFactorEnabled,
      addresses:        user.addresses,
    },
  }
}

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role)
}
