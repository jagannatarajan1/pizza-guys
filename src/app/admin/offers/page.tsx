'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, X, Loader2, Tag, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
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
  orderTypes: string[]
  combinable: boolean
  combinesWith: string[]
  applicableCategories: string[]
}

type CategoryOption = { slug: string; name: string }

const emptyForm = {
  code: '', type: 'percentage' as Coupon['type'], value: 10, minOrder: 15, description: '',
  usageLimit: '', expiresAt: '', orderTypes: [] as string[], combinable: false, combinesWith: [] as string[],
  applicableCategories: [] as string[],
}

export default function AdminOffersPage() {
  const [coupons, setCoupons]     = useState<Coupon[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]           = useState(emptyForm)

  useEffect(() => {
    fetch('/api/menu/categories').then((r) => r.json()).then((d) => {
      setCategories((d.categories ?? []).map((c: { slug: string; name: string }) => ({ slug: c.slug, name: c.name })))
    }).catch(() => {})
  }, [])

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

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      description: c.description,
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      orderTypes: c.orderTypes,
      combinable: c.combinable,
      combinesWith: c.combinesWith,
      applicableCategories: c.applicableCategories,
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.code || !form.description) { toast.error('Code and description required'); return }
    setSaving(true)
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: form.value,
        minOrder: form.minOrder,
        description: form.description,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
        orderTypes: form.orderTypes,
        combinable: form.combinable,
        combinesWith: form.combinesWith,
        applicableCategories: form.applicableCategories,
      }
      const res = await fetch(editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status === 409) { toast.error('Coupon code already exists'); return }
      if (!res.ok) { toast.error(editingId ? 'Failed to update coupon' : 'Failed to create coupon'); return }
      toast.success(editingId ? 'Coupon updated!' : 'Coupon created!')
      setShowForm(false)
      setEditingId(null)
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

  const toggleOrderType = (value: string) => {
    setForm((p) => ({
      ...p,
      orderTypes: p.orderTypes.includes(value) ? p.orderTypes.filter((v) => v !== value) : [...p.orderTypes, value],
    }))
  }

  const toggleCombinesWith = (code: string) => {
    setForm((p) => ({
      ...p,
      combinesWith: p.combinesWith.includes(code) ? p.combinesWith.filter((v) => v !== code) : [...p.combinesWith, code],
    }))
  }

  const toggleCategory = (slug: string) => {
    setForm((p) => ({
      ...p,
      applicableCategories: p.applicableCategories.includes(slug)
        ? p.applicableCategories.filter((v) => v !== slug)
        : [...p.applicableCategories, slug],
    }))
  }

  const otherCoupons = coupons.filter((c) => c.code !== form.code)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Offers &amp; Coupons</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null) }}><X size={18} className="text-gray-400" /></button>
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

          {/* Order type restriction */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Applicable Order Types</label>
            <div className="flex gap-4">
              {(['delivery', 'collection'] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.orderTypes.length === 0 || form.orderTypes.includes(v)}
                    onChange={() => toggleOrderType(v)}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-400"
                  />
                  {v === 'delivery' ? 'Delivery' : 'Collection'}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Leave both checked to allow either order type.</p>
          </div>

          {/* Category restriction */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Applicable Categories</label>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400">No categories found.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <label key={cat.slug} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.applicableCategories.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-400"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-1">Leave all unchecked to apply to the whole order.</p>
          </div>

          {/* Combination rules */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Can this coupon be combined with other coupons?</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio" name="combinable"
                  checked={!form.combinable}
                  onChange={() => setForm((p) => ({ ...p, combinable: false, combinesWith: [] }))}
                  className="text-red-600 focus:ring-red-400"
                />
                No (Exclusive)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio" name="combinable"
                  checked={form.combinable}
                  onChange={() => setForm((p) => ({ ...p, combinable: true }))}
                  className="text-red-600 focus:ring-red-400"
                />
                Yes
              </label>
            </div>

            {form.combinable && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Combine With</p>
                {otherCoupons.length === 0 ? (
                  <p className="text-xs text-gray-400">No other coupons yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {otherCoupons.map((c) => (
                      <label key={c.code} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.combinesWith.includes(c.code)}
                          onChange={() => toggleCombinesWith(c.code)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-400"
                        />
                        <span className="font-mono font-bold">{c.code}</span>
                        {!c.combinable && <span className="text-[11px] text-amber-600">(also needs &quot;{c.code}&quot; set to Yes to actually combine)</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} {editingId ? 'Save Changes' : 'Create Coupon'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
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
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(c)} title="Edit" className="text-gray-400 hover:text-blue-600 transition-colors">
                    <Pencil size={15} />
                  </button>
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
                <div>
                  {c.orderTypes.length === 0 ? 'Delivery & Collection' : c.orderTypes.map((t) => t === 'delivery' ? 'Delivery' : 'Collection').join(' & ')}
                </div>
                <div>{c.combinable ? `Combinable with: ${c.combinesWith.length ? c.combinesWith.join(', ') : 'none selected'}` : 'Exclusive (no combining)'}</div>
                <div>
                  {c.applicableCategories.length === 0
                    ? 'Applies to whole order'
                    : `Applies to: ${c.applicableCategories.map((slug) => categories.find((cat) => cat.slug === slug)?.name ?? slug).join(', ')}`}
                </div>
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
