'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Check } from 'lucide-react'
import toast from 'react-hot-toast'

function getMailLink(email: string) {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (domain === 'gmail.com')      return 'https://mail.google.com'
  if (domain === 'yahoo.com')      return 'https://mail.yahoo.com'
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com')
                                   return 'https://outlook.live.com'
  if (domain === 'icloud.com')     return 'https://www.icloud.com/mail'
  return `https://mail.${domain}`
}

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  // Mirrors the server's validatePasswordStrength (src/lib/api-guard.ts) exactly,
  // so a password that looks good here is never rejected after submit.
  const pwChecks = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(form.password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(form.password) },
    { label: 'One number', met: /[0-9]/.test(form.password) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(form.password) },
  ]
  const pwValid = pwChecks.every((c) => c.met)
  const confirmValid = form.confirm.length > 0 && form.confirm === form.password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.phone || !form.password) { toast.error('Please fill in all fields'); return }
    if (!pwValid) { toast.error('Your password does not meet all requirements'); return }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Registration failed'); return }
      setSentEmail(form.email)
      setDone(true)
    } catch { toast.error('Something went wrong') }
    finally  { setLoading(false) }
  }

  if (done) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 text-sm mb-6">
            We sent a verification link to <strong>{sentEmail}</strong>. Click the link to activate your account.
          </p>
          <a
            href={getMailLink(sentEmail)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm mb-4"
          >
            <Mail size={16} /> Open Email App
          </a>
          <p className="text-xs text-gray-400 mt-2">
            Didn&apos;t receive it?{' '}
            <button
              onClick={async () => {
                await fetch('/api/auth/resend-verification', {
                  method:  'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body:    JSON.stringify({ email: sentEmail }),
                })
                toast.success('Verification email resent!')
              }}
              className="text-red-600 font-semibold hover:underline"
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black text-xl">PG</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join Pizza Guys for faster ordering</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'name', label: 'Full Name', placeholder: 'John Smith', type: 'text', auto: 'name' },
              { key: 'email', label: 'Email Address', placeholder: 'john@example.com', type: 'email', auto: 'email' },
              { key: 'phone', label: 'Mobile Number', placeholder: '07700900000', type: 'tel', auto: 'tel' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  autoComplete={f.auto}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-red-400"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                {pwChecks.map((c) => (
                  <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.met ? 'text-green-600' : 'text-gray-400'}`}>
                    <Check size={12} className={c.met ? 'opacity-100' : 'opacity-30'} />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              />
              {form.confirm && (
                <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${confirmValid ? 'text-green-600' : 'text-red-500'}`}>
                  <Check size={12} className={confirmValid ? 'opacity-100' : 'opacity-30'} />
                  {confirmValid ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !pwValid || !confirmValid}
              className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${loading || !pwValid || !confirmValid ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
