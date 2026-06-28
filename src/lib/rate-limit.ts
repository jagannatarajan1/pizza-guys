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
