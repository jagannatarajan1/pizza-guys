import crypto from 'crypto'

const SECRET = process.env.AUTH_SECRET!

// Plain 6-digit codes are never stored — only an HMAC of the code, keyed with
// the server secret, so a database leak alone can't be brute-forced offline
// (the attacker would also need AUTH_SECRET). Unlike a password there's no
// per-user salt: the code is short-lived, single-use and attempt-limited, so
// a fast, unsalted HMAC is an appropriate (and cheap) trade-off here.
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', SECRET).update(otp).digest('hex')
}

export function verifyOtp(otp: string, hash: string): boolean {
  const candidate = Buffer.from(hashOtp(otp))
  const actual = Buffer.from(hash)
  if (candidate.length !== actual.length) return false
  return crypto.timingSafeEqual(candidate, actual)
}

// How long an emailed sign-in code stays valid. Configurable via the
// OTP_EXPIRES_MINUTES environment variable; anything missing, non-numeric or
// wildly out of range falls back to 5 minutes rather than silently accepting a
// value that would make codes either unusable or long-lived enough to brute
// force. Read once at module load — it is deployment configuration, not
// per-request state.
const DEFAULT_OTP_EXPIRY_MINUTES = 5

function readExpiryMinutes(): number {
  const raw = Number(process.env.OTP_EXPIRES_MINUTES)
  if (!Number.isFinite(raw)) return DEFAULT_OTP_EXPIRY_MINUTES
  const rounded = Math.round(raw)
  if (rounded < 1 || rounded > 30) return DEFAULT_OTP_EXPIRY_MINUTES
  return rounded
}

export const OTP_EXPIRES_MINUTES = readExpiryMinutes()

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000)
}
