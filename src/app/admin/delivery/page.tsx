'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Zone = { id: string; postcode: string; minOrder: number; deliveryFee: number; enabled: boolean }

const emptyForm = { postcode: '', minOrder: 10, deliveryFee: 1.99 }

export default function AdminDeliveryPage() {
  const [zones, setZones]       = useState<Zone[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/delivery-zones')
      const data = await res.json()
      setZones(data.zones ?? [])
    } catch { toast.error('Failed to load zones') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (zone: Zone) => {
    setEditId(zone.id)
    setForm({ postcode: zone.postcode, minOrder: zone.minOrder, deliveryFee: zone.deliveryFee })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm) }

  const save = async () => {
    if (!form.postcode.trim()) { toast.error('Postcode required'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch(`/api/admin/delivery-zones/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (!res.ok) { toast.error('Failed to update'); return }
        toast.success('Zone updated!')
      } else {
        const res = await fetch('/api/admin/delivery-zones', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        if (res.status === 409) { toast.error('Postcode already exists'); return }
        if (!res.ok) { toast.error('Failed to create'); return }
        toast.success('Zone added!')
      }
      closeForm(); load()
    } finally { setSaving(false) }
  }

  const remove = async (zone: Zone) => {
    if (!confirm(`Remove delivery zone ${zone.postcode}?`)) return
    const res = await fetch(`/api/admin/delivery-zones/${zone.id}`, { method: 'DELETE' })
    if (res.ok) { setZones((p) => p.filter((z) => z.id !== zone.id)); toast.success('Zone removed') }
  }

  const toggleEnabled = async (zone: Zone) => {
    const res = await fetch(`/api/admin/delivery-zones/${zone.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !zone.enabled }),
    })
    if (res.ok) setZones((p) => p.map((z) => z.id === zone.id ? { ...z, enabled: !z.enabled } : z))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Delivery Zones</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null) }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Zone
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editId ? 'Edit Zone' : 'New Delivery Zone'}</h2>
            <button onClick={closeForm}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode Prefix *</label>
              <input
                value={form.postcode}
                onChange={(e) => setForm((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 font-mono"
                placeholder="TW18"
                disabled={!!editId}
              />
              <p className="text-xs text-gray-400 mt-1">e.g. TW18 covers all TW18 postcodes</p>
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
              {saving && <Loader2 size={14} className="animate-spin" />} {editId ? 'Update Zone' : 'Add Zone'}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Postcode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Min Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Delivery Fee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {zones.map((zone) => (
                <tr key={zone.id} className={`hover:bg-gray-50 transition-colors ${!zone.enabled ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">{zone.postcode}</td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(zone.minOrder)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatPrice(zone.deliveryFee)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleEnabled(zone)} className="flex items-center gap-1.5 text-xs font-semibold transition-colors">
                      {zone.enabled
                        ? <><ToggleRight size={18} className="text-green-500" /><span className="text-green-600">Active</span></>
                        : <><ToggleLeft  size={18} className="text-gray-400"  /><span className="text-gray-400">Disabled</span></>
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(zone)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => remove(zone)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {zones.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No delivery zones configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
