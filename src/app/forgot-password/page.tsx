'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email address'); return }
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black text-xl">PG</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">We&apos;ll send you a link to reset your password</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-green-600" />
            </div>
            <h2 className="font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-4">
              If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly. Check your spam folder if it doesn&apos;t arrive.
            </p>
            <Link href="/login" className="text-red-600 font-semibold hover:underline text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        )}

        <div className="text-center mt-4">
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
