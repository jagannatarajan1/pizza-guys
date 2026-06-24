'use client'
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

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

type AuthContextType = {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<boolean>
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

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data.user) setUser(data.user)
    return true
  }

  const register = async (formData: { name: string; email: string; phone: string; password: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    if (!res.ok) return false
    // Cookie is set by the server; reload the user profile
    await loadUser()
    return true
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
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, register, logout, updateProfile, addAddress, updateAddress, deleteAddress }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
