'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react'

type Reason = 'expired' | 'invalid' | 'missing' | 'taken' | 'network'

const REASON_COPY: Record<Reason, { title: string; message: string }> = {
  expired: {
    title:   'Link expired',
    message: 'This confirmation link has expired. Go back to My Account and request the email change again.',
  },
  invalid: {
    title:   "Link isn't valid",
    message: "This link isn't valid — it may have already been used.",
  },
  missing: {
    title:   'Missing confirmation link',
    message: "We couldn't find an email change request for this link.",
  },
  taken: {
    title:   'Email already in use',
    message: 'That email address was registered to another account before you confirmed. Your email was not changed.',
  },
  network: {
    title:   'Something went wrong',
    message: 'We couldn’t reach the server. Check your connection and try again.',
  },
}

function VerifyEmailChangeContent() {
  const searchParams = useSearchParams()
  const token         = searchParams.get('token')

  const [status, setStatus] = useState<'confirm' | 'loading' | 'success' | 'error' | 'no-token'>(
    token ? 'confirm' : 'no-token'
  )
  const [reason, setReason] = useState<Reason>('invalid')

  const handleVerify = () => {
    if (!token) return
    setStatus('loading')

    fetch(`/api/auth/verify-email-change?token=${token}`)
      .then((res) => res.json())
      .then((data: { ok: boolean; reason?: Reason }) => {
        if (data.ok) { setStatus('success'); return }
        setStatus('error')
        setReason(data.reason ?? 'invalid')
      })
      .catch(() => {
        setStatus('error')
        setReason('network')
      })
  }

  if (status === 'confirm') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShieldCheck size={56} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Confirm your new email</h1>
          <p className="text-gray-500 mb-6">Click below to confirm this is your new email address.</p>
          <button
            onClick={handleVerify}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Confirm new email
          </button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Confirming your new email…</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Email updated!</h1>
          <p className="text-gray-500 mb-6">Your account email has been changed. Use your new email to sign in from now on.</p>
          <Link href="/dashboard" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl inline-block transition-colors">
            Go to My Account
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'no-token') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShieldCheck size={56} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 mb-2">Check your new inbox</h1>
          <p className="text-gray-500 mb-6">We sent a confirmation link to the new email address you entered. Click the link there to finish the change.</p>
          <Link href="/dashboard" className="text-red-600 font-semibold hover:underline text-sm">
            Back to My Account
          </Link>
        </div>
      </div>
    )
  }

  // error
  const copy = REASON_COPY[reason]
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <XCircle size={56} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-gray-900 mb-2">{copy.title}</h1>
        <p className="text-gray-500 mb-6">{copy.message}</p>
        <Link href="/dashboard" className="text-red-600 font-semibold hover:underline text-sm">
          Back to My Account
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailChangePage() {
  return (
    <Suspense>
      <VerifyEmailChangeContent />
    </Suspense>
  )
}
