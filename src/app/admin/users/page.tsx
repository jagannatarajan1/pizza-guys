'use client'
import { useState, useEffect } from 'react'
import { UserCog, Plus, Trash2, Loader2, Shield, Eye, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { ROLE_LABELS } from '@/lib/roles'

type StaffUser = { id: string; name: string; email: string; role: string; createdAt: string }

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Super Admin', desc: 'Full access to everything',               icon: Shield, color: 'text-red-600 bg-red-50' },
  { value: 'staff',  label: 'Staff',       desc: 'Manage orders, customers & offers',       icon: Users,  color: 'text-blue-600 bg-blue-50' },
  { value: 'viewer', label: 'Viewer',      desc: 'Read-only: orders, customers & reports',  icon: Eye,    color: 'text-gray-600 bg-gray-100' },
]

const ROLE_BADGE: Record<string, string> = {
  admin:  'bg-red-100 text-red-700',
  staff:  'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<StaffUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState({ name: '', email: '', password: '', role: 'staff' })

  const load = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch { toast.error('Failed to load users') }
    finally  { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('Fill all fields'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to create user'); return }
      setUsers((prev) => [...prev, data.user])
      setForm({ name: '', email: '', password: '', role: 'staff' })
      setShowAdd(false)
      toast.success(`${data.user.name} added as ${ROLE_LABELS[data.user.role]}`)
    } catch { toast.error('Failed to create user') }
    finally  { setSaving(false) }
  }

  const handleRoleChange = async (user: StaffUser, role: string) => {
    const prev = user.role
    setUsers((u) => u.map((x) => x.id === user.id ? { ...x, role } : x))
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role }),
      })
      if (!res.ok) { setUsers((u) => u.map((x) => x.id === user.id ? { ...x, role: prev } : x)); toast.error('Failed to update role') }
      else toast.success(`${user.name} → ${ROLE_LABELS[role]}`)
    } catch { setUsers((u) => u.map((x) => x.id === user.id ? { ...x, role: prev } : x)); toast.error('Failed to update role') }
  }

  const handleRemove = async (user: StaffUser) => {
    if (!confirm(`Remove ${user.name}'s admin access? They'll become a regular customer.`)) return
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed'); return }
      setUsers((u) => u.filter((x) => x.id !== user.id))
      toast.success(`${user.name} removed`)
    } catch { toast.error('Failed to remove') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCog size={24} className="text-gray-700" />
          <div>
            <h1 className="text-xl font-black text-gray-900">Staff & Roles</h1>
            <p className="text-sm text-gray-500">Manage who has access to the admin panel</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Staff
        </button>
      </div>

      {/* Role reference */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {ROLE_OPTIONS.map((r) => (
          <div key={r.value} className={`rounded-xl p-4 flex gap-3 items-start ${r.color}`}>
            <r.icon size={18} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">{r.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">New Staff Member</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min 8 characters" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white">
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Add Staff Member
            </button>
            <button onClick={() => setShowAdd(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Staff Members ({users.length})</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No staff members yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <span className="text-red-600 font-black text-sm">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user, e.target.value)}
                  className={`text-xs font-semibold px-2 py-1.5 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-red-300 cursor-pointer ${ROLE_BADGE[user.role] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button
                  onClick={() => handleRemove(user)}
                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  title="Remove access"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
