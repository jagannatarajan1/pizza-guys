'use client'
import { useState } from 'react'
import { Plus, Trash2, X, Tag } from 'lucide-react'
import { activeCoupons as initial } from '@/lib/menu-data'
import toast from 'react-hot-toast'

type Coupon = { code: string; type: 'percentage' | 'fixed' | 'freeDelivery'; value: number; minOrder: number; description: string }

export default function AdminOffersPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(initial.map((c) => ({ ...c, type: c.type as Coupon['type'] })))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Coupon>({ code: '', type: 'percentage', value: 10, minOrder: 15, description: '' })

  const save = () => {
    if (!form.code || !form.description) { toast.error('Code and description required'); return }
    if (coupons.find((c) => c.code === form.code)) { toast.error('Coupon code already exists'); return }
    setCoupons((prev) => [...prev, form])
    setShowForm(false)
    setForm({ code: '', type: 'percentage', value: 10, minOrder: 15, description: '' })
    toast.success('Coupon created!')
  }

  const remove = (code: string) => {
    setCoupons((prev) => prev.filter((c) => c.code !== code))
    toast.success('Coupon removed')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Offers &amp; Coupons</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">New Coupon</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coupon Code *</label>
              <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '') }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 font-mono" placeholder="SAVE15" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Type</label>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Coupon['type'] }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                <option value="percentage">Percentage Off</option>
                <option value="fixed">Fixed Amount Off</option>
                <option value="freeDelivery">Free Delivery</option>
              </select>
            </div>
            {form.type !== 'freeDelivery' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Value ({form.type === 'percentage' ? '%' : '£'})</label>
                <input type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Minimum Order (£)</label>
              <input type="number" value={form.minOrder} onChange={(e) => setForm((p) => ({ ...p, minOrder: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
              <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="e.g. 15% off orders over £20" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">Create Coupon</button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.code} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-black text-gray-900 text-xl font-mono">{c.code}</div>
                <div className="text-xs text-green-600 font-medium">
                  {c.type === 'percentage' && `${c.value}% off`}
                  {c.type === 'fixed' && `£${c.value} off`}
                  {c.type === 'freeDelivery' && 'Free delivery'}
                </div>
              </div>
              <button onClick={() => remove(c.code)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-2">{c.description}</p>
            <p className="text-xs text-gray-400">Min order: £{c.minOrder.toFixed(2)}</p>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="sm:col-span-3 text-center py-12 text-gray-400">
            <Tag size={32} className="mx-auto mb-2 opacity-30" />
            <p>No coupons yet. Create one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
