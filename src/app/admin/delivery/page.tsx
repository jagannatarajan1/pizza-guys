'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, MapPin, Gift } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Band = { id: string; fromMiles: number; toMiles: number; minOrder: number; deliveryFee: number }

const emptyForm = { fromMiles: 0, toMiles: 1, minOrder: 10, deliveryFee: 1.99 }

export default function AdminDeliveryPage() {
  const [bands, setBands]       = useState<Band[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState(emptyForm)

  const [radius, setRadius]         = useState('3')
  const [radiusSaving, setRadiusSaving] = useState(false)
  const [restaurantCoords, setRestaurantCoords] = useState({ lat: '', lng: '' })
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState('0')
  const [freeDeliverySaving, setFreeDeliverySaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bandsRes, cfgRes] = await Promise.all([
        fetch('/api/admin/delivery-bands'),
        fetch('/api/admin/site-config'),
      ])
      const bandsData = await bandsRes.json()
      const cfgData   = await cfgRes.json()
      setBands(bandsData.bands ?? [])
      setRadius(cfgData.config?.delivery_max_radius_miles ?? '3')
      setRestaurantCoords({ lat: cfgData.config?.biz_map_lat ?? '', lng: cfgData.config?.biz_map_lng ?? '' })
      setFreeDeliveryThreshold(cfgData.config?.free_delivery_threshold ?? '0')
    } catch { toast.error('Failed to load delivery settings') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const saveRadius = async () => {
    setRadiusSaving(true)
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { delivery_max_radius_miles: radius } }),
      })
      if (res.ok) toast.success('Delivery radius saved!')
      else toast.error('Failed to save')
    } finally { setRadiusSaving(false) }
  }

  const saveFreeDeliveryThreshold = async () => {
    setFreeDeliverySaving(true)
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: { free_delivery_threshold: freeDeliveryThreshold } }),
      })
      if (res.ok) toast.success('Free delivery threshold saved!')
      else toast.error('Failed to save')
    } finally { setFreeDeliverySaving(false) }
  }

  const openEdit = (band: Band) => {
    setEditId(band.id)
    setForm({ fromMiles: band.fromMiles, toMiles: band.toMiles, minOrder: band.minOrder, deliveryFee: band.deliveryFee })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm) }

  const save = async () => {
    if (form.toMiles <= form.fromMiles) { toast.error('"To" distance must be greater than "From" distance'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch(`/api/admin/delivery-bands/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) { toast.error('Failed to update'); return }
        toast.success('Band updated!')
      } else {
        const res = await fetch('/api/admin/delivery-bands', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) { toast.error('Failed to create'); return }
        toast.success('Band added!')
      }
      closeForm(); load()
    } finally { setSaving(false) }
  }

  const remove = async (band: Band) => {
    if (!confirm(`Remove the ${band.fromMiles}–${band.toMiles} mile band?`)) return
    const res = await fetch(`/api/admin/delivery-bands/${band.id}`, { method: 'DELETE' })
    if (res.ok) { setBands((p) => p.filter((b) => b.id !== band.id)); toast.success('Band removed') }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Delivery Area</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Delivery is worked out by straight-line distance from your restaurant, not postcode names — enter a
          postcode at checkout and we calculate the distance automatically.
        </p>
      </div>

      {/* Restaurant location + max radius */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-red-500" />
          <h2 className="font-bold text-gray-900 text-sm">Restaurant Location &amp; Range</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Location comes from Site Settings ({restaurantCoords.lat || '—'}, {restaurantCoords.lng || '—'}) — update
          it there if the shop ever moves.
        </p>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Maximum Delivery Radius (miles)</label>
            <input
              type="number" step="0.1" min="0"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <button
            onClick={saveRadius}
            disabled={radiusSaving}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {radiusSaving && <Loader2 size={14} className="animate-spin" />} Save
          </button>
        </div>
      </div>

      {/* Free delivery threshold */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift size={16} className="text-red-500" />
          <h2 className="font-bold text-gray-900 text-sm">Free Delivery Threshold</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          When a delivery order&apos;s subtotal reaches this amount, the delivery fee is automatically waived —
          no coupon code needed. Set to £0 to turn this off.
        </p>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Free Delivery Over (£)</label>
            <input
              type="number" step="0.01" min="0"
              value={freeDeliveryThreshold}
              onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
              className="w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <button
            onClick={saveFreeDeliveryThreshold}
            disabled={freeDeliverySaving}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {freeDeliverySaving && <Loader2 size={14} className="animate-spin" />} Save
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">Delivery Fee Bands</h2>
        <button
          onClick={() => { setShowForm(true); setEditId(null) }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Band
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editId ? 'Edit Band' : 'New Delivery Band'}</h2>
            <button onClick={closeForm}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From (miles)</label>
              <input
                type="number" step="0.1" min="0"
                value={form.fromMiles}
                onChange={(e) => setForm((p) => ({ ...p, fromMiles: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">To (miles)</label>
              <input
                type="number" step="0.1" min="0"
                value={form.toMiles}
                onChange={(e) => setForm((p) => ({ ...p, toMiles: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Order (£)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.minOrder}
                onChange={(e) => setForm((p) => ({ ...p, minOrder: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Fee (£)</label>
              <input
                type="number" step="0.01" min="0"
                value={form.deliveryFee}
                onChange={(e) => setForm((p) => ({ ...p, deliveryFee: parseFloat(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} {editId ? 'Update Band' : 'Add Band'}
            </button>
            <button onClick={closeForm} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Distance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Min Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Delivery Fee</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bands.map((band) => (
                <tr key={band.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{band.fromMiles}–{band.toMiles} mi</td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(band.minOrder)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(band.deliveryFee)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(band)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => remove(band)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {bands.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No delivery bands configured — add one above, e.g. 0–3 miles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
