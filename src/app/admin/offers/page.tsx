'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, X, Loader2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Coupon = {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'freeDelivery'
  value: number
  minOrder: number
  description: string
  active: boolean
  usageCount: number
  usageLimit: number | null
  expiresAt: string | null
}

const emptyForm = { code: '', type: 'percentage' as Coupon['type'], value: 10, minOrder: 15, description: '', usageLimit: '', expiresAt: '' }

export default function AdminOffersPage() {
  const [coupons, setCoupons]   = useState<Coupon[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/coupons')
      const data = await res.json()
      setCoupons(data.coupons ?? [])
    } catch { toast.error('Failed to load coupons') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async () => {
    if (!form.code || !form.description) { toast.error('Code and description required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: form.value,
          minOrder: form.minOrder,
          description: form.description,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
        }),
      })
      if (res.status === 409) { toast.error('Coupon code already exists'); return }
      if (!res.ok) { toast.error('Failed to create coupon'); return }
      toast.success('Coupon created!')
      setShowForm(false)
      setForm(emptyForm)
      load()
    } finally { setSaving(false) }
  }

  const toggleActive = async (c: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !c.active }),
    })
    if (res.ok) setCoupons((p) => p.map((x) => x.id === c.id ? { ...x, active: !x.active } : x))
  }

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return
    const res = await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' })
    if (res.ok) { setCoupons((p) => p.filter((x) => x.id !== c.id)); toast.success('Coupon deleted') }
  }

  const discountLabel = (c: Coupon) => {
    if (c.type === 'percentage')   return `${c.value}% off`
    if (c.type === 'fixed')        return `${formatPrice(c.value)} off`
    if (c.type === 'freeDelivery') return 'Free delivery'
    return ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Offers &amp; Coupons</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">New Coupon</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coupon Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 font-mono"
                placeholder="SAVE15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Coupon['type'] }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              >
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="freeDelivery">Free Delivery</option>
              </select>
            </div>
            {form.type !== 'freeDelivery' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Value ({form.type === 'percentage' ? '%' : '£'})
                </label>
                <input
                  type="number" step={form.type === 'percentage' ? '1' : '0.01'} min="0"
                  value={form.value}
                  onChange={(e) => setForm((p) => ({ ...p, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order (£)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.minOrder}
                onChange={(e) => setForm((p) => ({ ...p, minOrder: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                placeholder="e.g. 15% off orders over £20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Usage Limit (optional)</label>
              <input
                type="number" min="1"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expires (optional)</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} Create Coupon
            </button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className={`bg-white rounded-2xl border p-5 transition-opacity ${c.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-red-500 shrink-0" />
                  <span className="font-black text-gray-900 font-mono text-sm">{c.code}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(c)} title={c.active ? 'Deactivate' : 'Activate'}>
                    {c.active
                      ? <ToggleRight size={18} className="text-green-500" />
                      : <ToggleLeft  size={18} className="text-gray-400" />
                    }
                  </button>
                  <button onClick={() => remove(c)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="text-xl font-black text-gray-900 mb-1">{discountLabel(c)}</div>
              <p className="text-xs text-gray-500 mb-3">{c.description}</p>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Min order: {formatPrice(c.minOrder)}</div>
                {c.usageLimit !== null && <div>Usage: {c.usageCount}/{c.usageLimit}</div>}
                {c.expiresAt && <div>Expires: {new Date(c.expiresAt).toLocaleDateString('en-GB')}</div>}
              </div>
              {!c.active && (
                <div className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Inactive</div>
              )}
            </div>
          ))}
          {coupons.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-400">No coupons yet</div>
          )}
        </div>
      )}
    </div>
  )
}
