import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.EMAIL_FROM ?? 'Pizza Guys <noreply@pizzaguys.co.uk>'
const BASE   = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${BASE}/verify-email?token=${token}`
  return resend.emails.send({
    from:    FROM,
    to,
    subject: 'Verify your Pizza Guys account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="background:#dc2626;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px">
          <span style="color:#fff;font-weight:900;font-size:16px">PG</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 8px">Verify your email</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px">Hi ${name}, thanks for signing up! Click the button below to verify your email address and activate your account.</p>
        <a href="${url}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:12px;margin-bottom:24px">Verify my email</a>
        <p style="color:#888;font-size:13px;margin:0 0 8px">Or paste this link in your browser:</p>
        <p style="color:#dc2626;font-size:13px;word-break:break-all;margin:0 0 24px">${url}</p>
        <p style="color:#bbb;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${BASE}/reset-password?token=${token}`
  return resend.emails.send({
    from:    FROM,
    to,
    subject: 'Reset your Pizza Guys password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="background:#dc2626;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px">
          <span style="color:#fff;font-weight:900;font-size:16px">PG</span>
        </div>
        <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 8px">Reset your password</h1>
        <p style="color:#555;font-size:15px;margin:0 0 24px">Hi ${name}, we received a request to reset your password. Click below to choose a new one.</p>
        <a href="${url}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:12px;margin-bottom:24px">Reset password</a>
        <p style="color:#bbb;font-size:12px;border-top:1px solid #eee;padding-top:16px;margin:0">This link expires in 1 hour. If you didn't request a password reset, ignore this email — your password won't change.</p>
      </div>
    `,
  })
}
