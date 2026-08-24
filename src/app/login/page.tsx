'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') || '/'
  const { login, verifyLoginOtp, resendLoginOtp, setUser } = useAuth()

  const [form, setForm]               = useState({ email: '', password: '' })
  const [showPw, setShowPw]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [step, setStep]               = useState<'password' | 'otp' | '2fa'>('password')
  const [tempToken, setTempToken]     = useState('')
  const [totpCode, setTotpCode]       = useState('')

  // ── Mandatory post-password email OTP ──────────────────────────────────
  const [otpTempToken, setOtpTempToken] = useState('')
  const [otpCode, setOtpCode]           = useState('')
  const [maskedEmail, setMaskedEmail]   = useState('')
  const [otpError, setOtpError]         = useState('')
  const [cooldown, setCooldown]         = useState(0)
  const [resending, setResending]       = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step !== 'otp' || cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [step, cooldown])

  useEffect(() => {
    if (step === 'otp') otpInputRef.current?.focus()
  }, [step])

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    const result = await login(form.email, form.password)
    setLoading(false)
    if (!result.ok) { toast.error(result.error); return }
    setOtpTempToken(result.tempToken)
    setMaskedEmail(result.maskedEmail)
    setCooldown(result.cooldownSeconds)
    setOtpCode('')
    setOtpError('')
    setStep('otp')
  }

  const proceedFromOtpResult = (data: { ok: true; requires2FA: true; tempToken: string } | { ok: true; requires2FA: false; mustSetup2FA: boolean }) => {
    if (data.requires2FA) { setTempToken(data.tempToken); setStep('2fa'); return }
    if (data.mustSetup2FA) {
      toast('Please set up two-factor authentication to secure your account.', { icon: '🔐' })
      router.push('/admin/security')
      return
    }
    toast.success('Welcome back!')
    router.push(redirect)
  }

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code'); return }
    setLoading(true)
    setOtpError('')
    const result = await verifyLoginOtp(otpTempToken, otpCode)
    setLoading(false)
    if (!result.ok) { setOtpError(result.error); setOtpCode(''); otpInputRef.current?.focus(); return }
    proceedFromOtpResult(result)
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) { e.preventDefault(); setOtpCode(digits); setOtpError('') }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setOtpError('')
    const result = await resendLoginOtp(otpTempToken)
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

  const backToPassword = () => {
    setStep('password')
    setOtpTempToken('')
    setOtpCode('')
    setOtpError('')
    setTempToken('')
    setTotpCode('')
  }

  const handleTOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totpCode) { toast.error('Enter the code'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/2fa/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken, code: totpCode }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Invalid code'); setTotpCode(''); setLoading(false); return }
      if (data.user) setUser(data.user)
      toast.success('Welcome back!')
      router.push(redirect)
    } catch { toast.error('Something went wrong') }
    finally  { setLoading(false) }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            {step === '2fa'  ? <ShieldCheck size={26} className="text-white" /> :
             step === 'otp'  ? <Mail size={26} className="text-white" />        :
             <span className="text-white font-black text-xl">PG</span>}
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {step === '2fa' ? 'Two-factor authentication' :
             step === 'otp' ? 'Verify your email' :
             'Welcome back'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === '2fa' ? 'Enter the 6-digit code from your authenticator app' :
             step === 'otp' ? <>Enter the 6-digit code sent to <strong className="text-gray-700">{maskedEmail}</strong></> :
             'Sign in to your Pizza Guys account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          {step === 'password' && (
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email or Phone</label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Email or mobile number"
                  autoComplete="username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-red-400"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <div className="text-center">
                <Link href="/forgot-password" className="text-xs text-gray-400 hover:text-red-600 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}

          {step === 'otp' && (
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
                onClick={handleResendOtp}
                disabled={cooldown > 0 || resending}
                className={`w-full text-center text-sm font-semibold ${cooldown > 0 || resending ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:underline'}`}
              >
                {resending ? 'Sending…' : cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={backToPassword}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Change email / Back to login
              </button>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handleTOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Authenticator code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-red-400"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">Or enter one of your 8-character backup codes</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={backToPassword}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Back to login
              </button>
            </form>
          )}
        </div>

        {step === 'password' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-red-600 font-semibold hover:underline">Create one</Link>
          </p>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
