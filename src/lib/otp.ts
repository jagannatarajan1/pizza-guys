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
