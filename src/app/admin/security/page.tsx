'use client'
import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/auth-context'

type Phase = 'idle' | 'setup' | 'confirm' | 'backup' | 'disable'

export default function SecurityPage() {
  const { user } = useAuth()
  const [phase, setPhase]             = useState<Phase>('idle')
  const [qrCode, setQrCode]           = useState('')
  const [secret, setSecret]           = useState('')
  const [code, setCode]               = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copied, setCopied]           = useState(false)
  const [loading, setLoading]         = useState(false)
  const [has2FA, setHas2FA]           = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setHas2FA(d.user?.twoFactorEnabled ?? false))
  }, [])

  const startSetup = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/2fa/setup')
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setPhase('setup')
    } catch { toast.error('Failed to start setup') }
    finally  { setLoading(false) }
  }

  const confirmSetup = async () => {
    if (code.length < 6) { toast.error('Enter the 6-digit code'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/2fa/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setBackupCodes(data.backupCodes)
      setHas2FA(true)
      setPhase('backup')
      toast.success('Two-factor authentication enabled!')
    } catch { toast.error('Verification failed') }
    finally  { setLoading(false) }
  }

  const disable2FA = async () => {
    if (code.length < 6) { toast.error('Enter your current TOTP code to disable 2FA'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/2fa/setup', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setHas2FA(false)
      setPhase('idle')
      setCode('')
      toast.success('Two-factor authentication disabled')
    } catch { toast.error('Failed to disable 2FA') }
    finally  { setLoading(false) }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-gray-700" />
        <div>
          <h1 className="text-xl font-black text-gray-900">Security</h1>
          <p className="text-sm text-gray-500">Two-factor authentication for your admin account</p>
        </div>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl border p-5 mb-5 flex items-center gap-4 ${has2FA ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        {has2FA
          ? <ShieldCheck size={32} className="text-green-600 shrink-0" />
          : <AlertTriangle size={32} className="text-amber-500 shrink-0" />
        }
        <div>
          <div className={`font-bold ${has2FA ? 'text-green-800' : 'text-amber-800'}`}>
            {has2FA ? '2FA is enabled' : '2FA is not enabled'}
          </div>
          <div className={`text-sm mt-0.5 ${has2FA ? 'text-green-700' : 'text-amber-700'}`}>
            {has2FA
              ? `Your account (${user?.email}) is protected with an authenticator app.`
              : 'Admin accounts must have 2FA enabled. Set it up below.'}
          </div>
        </div>
      </div>

      {/* Phase: idle */}
      {phase === 'idle' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
          {!has2FA ? (
            <>
              <p className="text-sm text-gray-600">
                Use an authenticator app like <strong>Google Authenticator</strong>, <strong>Authy</strong>, or <strong>1Password</strong> to generate one-time codes.
              </p>
              <button onClick={startSetup} disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {loading ? 'Setting up…' : 'Set up 2FA'}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                2FA is active. To disable it, enter your current authenticator code below.
              </p>
              <button onClick={() => { setPhase('disable'); setCode('') }}
                className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:underline">
                <ShieldOff size={15} /> Disable 2FA
              </button>
            </>
          )}
        </div>
      )}

      {/* Phase: setup — scan QR */}
      {phase === 'setup' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">1. Scan this QR code</p>
            <p className="text-xs text-gray-500 mb-3">Open your authenticator app and scan the QR code below.</p>
            {qrCode && (
              <div className="flex justify-center">
                <Image src={qrCode} alt="QR code" width={180} height={180} className="rounded-xl border border-gray-200" />
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2 text-center">
              Can&apos;t scan? Enter this key manually: <span className="font-mono font-bold text-gray-600">{secret}</span>
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">2. Enter the 6-digit code</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={confirmSetup} disabled={loading || code.length < 6}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {loading ? 'Verifying…' : 'Verify & Enable'}
            </button>
            <button onClick={() => { setPhase('idle'); setCode('') }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Phase: backup codes */}
      {phase === 'backup' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Save these backup codes.</strong> Each code can only be used once. Store them somewhere safe — you&apos;ll need one if you lose access to your authenticator app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((c) => (
              <div key={c} className="font-mono text-sm text-center py-2 bg-gray-50 rounded-lg border border-gray-200 tracking-widest">
                {c}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={copyBackupCodes}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied!' : 'Copy codes'}
            </button>
            <button onClick={() => setPhase('idle')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Phase: disable */}
      {phase === 'disable' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <p className="text-sm text-gray-600">Enter your current 6-digit authenticator code to confirm disabling 2FA.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm tracking-widest text-center font-mono focus:outline-none focus:border-red-400"
          />
          <div className="flex gap-2">
            <button onClick={disable2FA} disabled={loading || code.length < 6}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              {loading ? 'Disabling…' : 'Disable 2FA'}
            </button>
            <button onClick={() => { setPhase('idle'); setCode('') }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
