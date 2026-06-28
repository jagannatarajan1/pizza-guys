'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import toast from 'react-hot-toast'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirect     = searchParams.get('redirect') || '/'
  const { login, setUser } = useAuth()

  const [form, setForm]           = useState({ email: '', password: '' })
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [step, setStep]           = useState<'password' | '2fa'>('password')
  const [tempToken, setTempToken] = useState('')
  const [totpCode, setTotpCode]   = useState('')

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    const result = await login(form.email, form.password)
    setLoading(false)
    if (!result.ok) { toast.error(result.error); return }
    if (result.requires2FA) { setTempToken(result.tempToken); setStep('2fa'); return }
    if (result.mustSetup2FA) {
      toast('Please set up two-factor authentication to secure your account.', { icon: '🔐' })
      router.push('/admin/security')
      return
    }
    toast.success('Welcome back!')
    router.push(redirect)
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
            {step === '2fa'
              ? <ShieldCheck size={26} className="text-white" />
              : <span className="text-white font-black text-xl">PG</span>
            }
          </div>
          <h1 className="text-2xl font-black text-gray-900">
            {step === '2fa' ? 'Two-factor authentication' : 'Welcome back'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === '2fa'
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Sign in to your Pizza Guys account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          {step === 'password' ? (
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
            </form>
          ) : (
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
                onClick={() => { setStep('password'); setTotpCode(''); setTempToken('') }}
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
