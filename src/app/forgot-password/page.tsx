'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<'email' | 'sms'>('email')
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) { toast.error('Please enter your email or phone number'); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSent(true)
    setLoading(false)
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
            <div className="text-4xl mb-3">✅</div>
            <h2 className="font-bold text-gray-900 mb-2">
              {method === 'email' ? 'Email sent!' : 'OTP sent!'}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {method === 'email'
                ? `We've sent a password reset link to ${value}. Check your inbox.`
                : `We've sent a 6-digit OTP to ${value}. It expires in 10 minutes.`}
            </p>
            <Link href="/login" className="text-red-600 font-semibold hover:underline text-sm">
              Back to login
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {/* Method toggle */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${method === 'email' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Mail size={14} /> Email Link
              </button>
              <button
                onClick={() => setMethod('sms')}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${method === 'sms' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Phone size={14} /> SMS OTP
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {method === 'email' ? 'Email Address' : 'Mobile Number'}
                </label>
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={method === 'email' ? 'john@example.com' : '07700900000'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {loading ? 'Sending...' : method === 'email' ? 'Send Reset Link' : 'Send OTP'}
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
