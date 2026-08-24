'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

// Standalone fallback for signup verification — reached directly (e.g. an old
// bookmark, or someone who left the register page and came back to finish
// later) rather than via the normal in-flow OTP screen shown right after
// registering (see src/app/register/page.tsx). Takes email + code since we
// can't otherwise know who's asking.
function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router        = useRouter()
  const { verifySignupOtp, resendSignupOtp } = useAuth()

  const [email, setEmail]   = useState(searchParams.get('email') ?? '')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const otpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setOtpError('Enter your email address'); return }
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code'); return }
    setLoading(true)
    setOtpError('')
    const result = await verifySignupOtp(email.trim().toLowerCase(), otpCode)
    setLoading(false)
    if (!result.ok) { setOtpError(result.error); setOtpCode(''); otpInputRef.current?.focus(); return }
    router.push('/dashboard?verified=1')
  }

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length === 6) { e.preventDefault(); setOtpCode(digits); setOtpError('') }
  }

  const handleResend = async () => {
    if (!email) { setOtpError('Enter your email address'); return }
    if (cooldown > 0 || resending) return
    setResending(true)
    setOtpError('')
    const result = await resendSignupOtp(email.trim().toLowerCase())
    setResending(false)
    if (!result.ok) {
      setOtpError(result.error)
      if (result.retryAfter) setCooldown(result.retryAfter)
      return
    }
    setCooldown(result.cooldownSeconds)
    setOtpCode('')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Mail size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to your email.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setOtpError('') }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
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
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-red-600 font-semibold hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
