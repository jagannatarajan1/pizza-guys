import prisma from './prisma'

export type AuditAction =
  | 'password_change_success'
  | 'password_change_failed'
  | 'email_change_requested'
  | 'email_change_verified'
  | 'email_change_failed'
  | 'login_otp_requested'
  | 'login_otp_success'
  | 'login_otp_failed'
  | 'signup_otp_requested'
  | 'signup_otp_verified'
  | 'signup_otp_failed'
  | 'signup_blocked_existing_account'

// Best-effort — a logging failure must never take down the request that
// triggered it, so this never throws.
export async function logAuditEvent(params: {
  userId?: string | null
  email?: string | null
  action: AuditAction
  detail?: string
  ip?: string
  userAgent?: string | null
}) {
  await prisma.auditLog
    .create({
      data: {
        userId: params.userId ?? null,
        email: params.email ?? null,
        action: params.action,
        detail: params.detail ?? '',
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    })
    .catch((err) => console.error('Failed to write audit log:', err))
}
