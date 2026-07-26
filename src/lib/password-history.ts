import prisma from './prisma'
import { verifyPassword } from './auth-utils'

const HISTORY_LIMIT = 5

// True if `plain` matches the user's current password or any of their last
// HISTORY_LIMIT passwords — checked before accepting a "new" password.
export async function isPasswordReused(userId: string, plain: string, currentHash: string): Promise<boolean> {
  if (await verifyPassword(plain, currentHash)) return true

  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
  })
  for (const entry of history) {
    if (await verifyPassword(plain, entry.passwordHash)) return true
  }
  return false
}

// Archive the password being replaced, then trim anything beyond the last
// HISTORY_LIMIT entries so the table doesn't grow unbounded.
export async function recordPasswordHistory(userId: string, oldHash: string): Promise<void> {
  await prisma.passwordHistory.create({ data: { userId, passwordHash: oldHash } })

  const stale = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: HISTORY_LIMIT,
    select: { id: true },
  })
  if (stale.length > 0) {
    await prisma.passwordHistory.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } })
  }
}
