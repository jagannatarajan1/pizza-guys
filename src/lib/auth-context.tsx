'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Address = {
  id: string
  label: string
  line1: string
  line2: string
  city: string
  postcode: string
  notes: string
  isDefault: boolean
}

export type User = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  addresses: Address[]
}

// A correct password is no longer enough to sign in on its own — it only
// unlocks the mandatory emailed one-time code, proven by the returned
// tempToken. See verifyLoginOtp() for what happens once that code is entered.
export type LoginResult =
  | { ok: false; error: string }
  | { ok: true; requiresOtp: true; tempToken: string; maskedEmail: string; cooldownSeconds: number }

export type OtpVerifyResult =
  | { ok: false; error: string }
  | { ok: true; requires2FA: true; tempToken: string }
  | { ok: true; requires2FA: false; mustSetup2FA: boolean }

export type OtpResendResult =
  | { ok: false; error: string; retryAfter?: number }
  | { ok: true; maskedEmail: string; cooldownSeconds: number }

// Signup no longer creates the account (or a session) directly — it only
// starts a pending registration and sends the activation code. See
// verifySignupOtp() for what actually creates the User row.
export type RegisterResult =
  | { ok: false; error: string; accountExists?: boolean }
  | { ok: true; email: string; maskedEmail: string; cooldownSeconds: number }

export type SignupVerifyResult =
  | { ok: false; error: string; accountExists?: boolean }
  | { ok: true }

type AuthContextType = {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  setUser: (u: User | null) => void
  login: (email: string, password: string) => Promise<LoginResult>
  verifyLoginOtp: (tempToken: string, code: string) => Promise<OtpVerifyResult>
  resendLoginOtp: (tempToken: string) => Promise<OtpResendResult>
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<RegisterResult>
  verifySignupOtp: (email: string, code: string) => Promise<SignupVerifyResult>
  resendSignupOtp: (email: string) => Promise<OtpResendResult>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  addAddress: (address: Omit<Address, 'id'>) => Promise<void>
  updateAddress: (id: string, data: Partial<Address>) => Promise<void>
  deleteAddress: (id: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/auth/me', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
    return () => ctrl.abort()
  }, [])

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.requiresOtp) return { ok: false, error: data.error ?? 'Invalid email or password' }
      return { ok: true, requiresOtp: true, tempToken: data.tempToken, maskedEmail: data.maskedEmail, cooldownSeconds: data.cooldownSeconds }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  // Submits the code from the mandatory post-password OTP screen. On success
  // this is the point a session actually gets created (or, for a staff
  // account with an authenticator app configured, the existing TOTP step is
  // handed the baton next — same as it always was, just one step later now).
  const verifyLoginOtp = async (tempToken: string, code: string): Promise<OtpVerifyResult> => {
    try {
      const res  = await fetch('/api/auth/login-otp/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken, code }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'Invalid verification code. Please try again.' }
      if (data.requires2FA) return { ok: true, requires2FA: true, tempToken: data.tempToken }
      if (data.user) setUser(data.user)
      return { ok: true, requires2FA: false, mustSetup2FA: !!data.mustSetup2FA }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  const resendLoginOtp = async (tempToken: string): Promise<OtpResendResult> => {
    try {
      const res  = await fetch('/api/auth/login-otp/resend', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempToken }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'Could not resend code', retryAfter: data.retryAfter }
      return { ok: true, maskedEmail: data.maskedEmail, cooldownSeconds: data.cooldownSeconds }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  const register = async (formData: { name: string; email: string; phone: string; password: string }): Promise<RegisterResult> => {
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok || !data.requiresOtp) return { ok: false, error: data.error ?? 'Registration failed', accountExists: !!data.accountExists }
      return { ok: true, email: data.email, maskedEmail: data.maskedEmail, cooldownSeconds: data.cooldownSeconds }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  // Submits the signup activation code. Only on success does the User row
  // (and a session) actually get created — see verify-email/route.ts.
  const verifySignupOtp = async (email: string, code: string): Promise<SignupVerifyResult> => {
    try {
      const res  = await fetch('/api/auth/verify-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'Invalid verification code. Please try again.', accountExists: !!data.accountExists }
      if (data.user) setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  const resendSignupOtp = async (email: string): Promise<OtpResendResult> => {
    try {
      const res  = await fetch('/api/auth/resend-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) return { ok: false, error: data.error ?? 'Could not resend code', retryAfter: data.retryAfter }
      return { ok: true, maskedEmail: data.maskedEmail, cooldownSeconds: data.cooldownSeconds }
    } catch {
      return { ok: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) setUser((u) => (u ? { ...u, ...data } : u))
  }

  const addAddress = async (address: Omit<Address, 'id'>) => {
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    })
    if (!res.ok) return
    const { address: newAddr } = await res.json()
    setUser((u) => {
      if (!u) return u
      const addresses = address.isDefault
        ? u.addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
        : [...u.addresses, newAddr]
      return { ...u, addresses }
    })
  }

  const updateAddress = async (id: string, data: Partial<Address>) => {
    const res = await fetch(`/api/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return
    setUser((u) => {
      if (!u) return u
      let addresses = u.addresses.map((a) => (a.id === id ? { ...a, ...data } : a))
      if (data.isDefault) addresses = addresses.map((a) => (a.id === id ? a : { ...a, isDefault: false }))
      return { ...u, addresses }
    })
  }

  const deleteAddress = async (id: string) => {
    const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    setUser((u) => (u ? { ...u, addresses: u.addresses.filter((a) => a.id !== id) } : u))
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, isLoading, login, verifyLoginOtp, resendLoginOtp, register, verifySignupOtp, resendSignupOtp, logout, updateProfile, addAddress, updateAddress, deleteAddress }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
