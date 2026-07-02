'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [status, setStatus]   = useState<'loading' | 'success' | 'error' | 'no-token'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('no-token'); return }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => {
        if (res.redirected) {
          // Server redirected to /dashboard — follow it
          router.push(res.url)
          return
        }
        return res.json().then((data) => {
          setStatus('error')
          setMessage(data.error ?? 'Verification failed')
        })
      })
      .catch(() => { setStatus('error'); setMessage('Something went wrong') })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Verifying your email…</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Email verified!</h1>
          <p className="text-gray-500 mb-6">Your account is now active. You&apos;re being signed in…</p>
          <Link href="/dashboard" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl inline-block transition-colors">
            Go to dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'no-token') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Mail size={56} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 mb-6">We sent a verification link to your email address. Click the link to activate your account.</p>
          <Link href="/login" className="text-red-600 font-semibold hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  // error
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <XCircle size={56} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">Link expired</h1>
        <p className="text-gray-500 mb-6">{message || 'This verification link is invalid or has expired.'}</p>
        <ResendForm />
      </div>
    </div>
  )
}

function ResendForm() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await fetch('/api/auth/resend-verification', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    }).catch(() => null)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return <p className="text-green-600 font-semibold text-sm">Check your inbox — a new link is on its way!</p>
  }

  return (
    <form onSubmit={handleResend} className="flex flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors"
      >
        {loading ? 'Sending…' : 'Resend verification email'}
      </button>
    </form>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
