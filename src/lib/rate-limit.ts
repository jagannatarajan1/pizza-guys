type Entry = { count: number; resetAt: number }
const store = new Map<string, Entry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of store) if (now > v.resetAt) store.delete(k)
}, 5 * 60 * 1000)

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return { limited: true, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { limited: false, remaining: limit - entry.count, retryAfter: 0 }
}

export function getClientIp(req: Request): string {
  const h = req.headers as unknown as Headers
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}

// ── Multi-dimensional limiting ────────────────────────────────────────────────
// A single IP-keyed counter is trivially defeated by rotating IPs, and a single
// account-keyed counter is trivially defeated by spraying many accounts. Real
// protection needs both at once, so sensitive endpoints declare every dimension
// they care about (per-IP, per-account, and sometimes a global ceiling) and this
// helper applies them together.
//
// All buckets are consumed, not short-circuited on the first hit, so an attacker
// can't use a cheap failing dimension to avoid spending budget on the others.
// The reported retryAfter is the longest wait across whichever buckets tripped.
export type LimitRule = { key: string; limit: number; windowMs: number }

export function rateLimitMulti(rules: LimitRule[]): { limited: boolean; retryAfter: number } {
  let limited = false
  let retryAfter = 0

  for (const rule of rules) {
    const r = rateLimit(rule.key, rule.limit, rule.windowMs)
    if (r.limited) {
      limited = true
      retryAfter = Math.max(retryAfter, r.retryAfter)
    }
  }

  return { limited, retryAfter }
}

// Case/whitespace-normalised, length-capped key fragment for anything derived
// from user input (an email address, a token). Keeps "A@B.com  " and "a@b.com"
// in the same bucket so casing can't be used to mint a fresh allowance, and
// stops an attacker growing the in-memory map with megabyte-long keys.
export function limitKeyPart(value: string): string {
  return value.trim().toLowerCase().slice(0, 254)
}
