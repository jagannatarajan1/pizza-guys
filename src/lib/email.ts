import nodemailer from 'nodemailer'
import { fetchSiteConfig } from './site-config'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function emailShell(cfg: Awaited<ReturnType<typeof fetchSiteConfig>>, bodyHtml: string) {
  const name     = cfg.biz_name      || 'Pizza Guys'
  const abbr     = (cfg.biz_logo_abbr || 'PG').slice(0, 3)
  const logoImg  = cfg.biz_logo_image || ''
  const dark     = cfg.theme_dark    || '#111111'
  const accent   = cfg.theme_accent  || '#FFD700'

  const logoCell = logoImg
    ? `<img src="${logoImg}" alt="${name}" width="44" height="44" style="width:44px;height:44px;border-radius:50%;object-fit:cover;display:block" />`
    : `<div style="width:44px;height:44px;border-radius:50%;background:${accent};font-weight:900;font-size:14px;color:${dark};text-align:center;line-height:44px">${abbr}</div>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:${dark};padding:24px 32px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td>${logoCell}</td>
                <td style="padding-left:12px;vertical-align:middle">
                  <span style="font-weight:900;font-size:18px;color:${accent}">${name}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            ${bodyHtml}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eee;padding:20px 32px;text-align:center">
            <p style="margin:0;font-size:12px;color:#999">&copy; ${new Date().getFullYear()} ${name}. All rights reserved.</p>
            <p style="margin:6px 0 0;font-size:12px;color:#bbb">${cfg.biz_address || ''}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(href: string, label: string, primary: string) {
  return `<a href="${href}" style="display:inline-block;background:${primary};color:#fff;font-weight:800;font-size:15px;text-decoration:none;padding:13px 30px;border-radius:10px;margin:20px 0">${label}</a>`
}

function fallbackLink(href: string) {
  return `<p style="font-size:12px;color:#999;margin:8px 0 0">Or copy this link: <span style="color:#555;word-break:break-all">${href}</span></p>`
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const cfg     = await fetchSiteConfig()
  const url     = `${BASE}/verify-email?token=${token}`
  const primary = cfg.theme_primary || '#E53935'
  const fromAddr = process.env.EMAIL_FROM ?? `${cfg.biz_name || 'Pizza Guys'} <${process.env.SMTP_USER}>`

  const body = `
    <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 8px">Verify your email</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${name}</strong>, thanks for signing up!</p>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">Click the button below to verify your email address and activate your account.</p>
    ${btn(url, 'Verify my email', primary)}
    ${fallbackLink(url)}
    <p style="color:#bbb;font-size:12px;margin:24px 0 0;padding-top:16px;border-top:1px solid #eee">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `

  return getTransport().sendMail({
    from:    fromAddr,
    to,
    subject: `Verify your ${cfg.biz_name || 'Pizza Guys'} account`,
    html:    emailShell(cfg, body),
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const cfg     = await fetchSiteConfig()
  const url     = `${BASE}/reset-password?token=${token}`
  const primary = cfg.theme_primary || '#E53935'
  const fromAddr = process.env.EMAIL_FROM ?? `${cfg.biz_name || 'Pizza Guys'} <${process.env.SMTP_USER}>`

  const body = `
    <h1 style="font-size:22px;font-weight:900;color:#111;margin:0 0 8px">Reset your password</h1>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 8px">Hi <strong>${name}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px">We received a request to reset your password. Click below to choose a new one.</p>
    ${btn(url, 'Reset password', primary)}
    ${fallbackLink(url)}
    <p style="color:#bbb;font-size:12px;margin:24px 0 0;padding-top:16px;border-top:1px solid #eee">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email — your password won't change.</p>
  `

  return getTransport().sendMail({
    from:    fromAddr,
    to,
    subject: `Reset your ${cfg.biz_name || 'Pizza Guys'} password`,
    html:    emailShell(cfg, body),
  })
}
