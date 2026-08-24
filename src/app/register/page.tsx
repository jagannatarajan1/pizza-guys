'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const router = useRouter()
  const { register, verifySignupOtp, resendSignupOtp } = useAuth()

  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [accountExists, setAccountExists] = useState(false)

  // ── Signup OTP step ──────────────────────────────────────────────────────
  const [step, setStep]             = useState<'form' | 'otp'>('form')
  const [otpCode, setOtpCode]       = useState('')
  const [otpError, setOtpError]     = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [cooldown, setCooldown]     = useState(0)
  const [resending, setResending]   = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step !== 'otp' || cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [step, cooldown])

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

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
    setAccountExists(false)
    setLoading(true)
    const result = await register(form)
    setLoading(false)
    if (!result.ok) {
      if (result.accountExists) { setAccountExists(true); return }
      toast.error(result.error)
      return
    }
    setMaskedEmail(result.maskedEmail)
    setCooldown(result.cooldownSeconds)
    setOtpCode('')
    setOtpError('')
    setStep('otp')
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code'); return }
    setLoading(true)
    setOtpError('')
    const result = await verifySignupOtp(form.email, otpCode)
    setLoading(false)
    if (!result.ok) { setOtpError(result.error); setOtpCode(''); otpInputRef.current?.focus(); return }
    toast.success('Account verified — welcome to Pizza Guys!')
    router.push('/dashboard?verified=1')
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) { e.preventDefault(); setOtpCode(digits); setOtpError('') }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setOtpError('')
    const result = await resendSignupOtp(form.email)
    setResending(false)
    if (!result.ok) {
      setOtpError(result.error)
      if (result.retryAfter) setCooldown(result.retryAfter)
      return
    }
    setCooldown(result.cooldownSeconds)
    setOtpCode('')
    toast.success('New code sent!')
  }

  if (step === 'otp') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Mail size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900">Verify your email</h1>
            <p className="text-gray-500 text-sm mt-1">
              Enter the 6-digit code sent to <strong className="text-gray-700">{maskedEmail}</strong>
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">6-digit code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError('') }}
                  onPaste={handleOtpPaste}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg tracking-[0.5em] text-center font-mono focus:outline-none focus:border-red-400"
                />
                {otpError && <p className="text-xs text-red-600 mt-1.5 text-center">{otpError}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${loading || otpCode.length !== 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Verifying…' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className={`w-full text-center text-sm font-semibold ${cooldown > 0 || resending ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:underline'}`}
              >
                {resending ? 'Sending…' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Change email
              </button>
            </form>
          </div>
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
        {accountExists && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-red-700 font-semibold mb-2">You already have an account. Please log in.</p>
            <Link
              href="/login"
              className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
            >
              Log In
            </Link>
          </div>
        )}
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
