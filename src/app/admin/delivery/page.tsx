'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { deliveryZones as initial } from '@/lib/menu-data'
import toast from 'react-hot-toast'

type Zone = { postcode: string; minOrder: number; deliveryFee: number }

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<Zone[]>([...initial])
  const [showForm, setShowForm] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [form, setForm] = useState<Zone>({ postcode: '', minOrder: 10, deliveryFee: 1.99 })

  const save = () => {
    if (!form.postcode) { toast.error('Postcode required'); return }
    if (editIndex !== null) {
      setZones((prev) => prev.map((z, i) => i === editIndex ? form : z))
      toast.success('Zone updated!')
    } else {
      setZones((prev) => [...prev, form])
      toast.success('Zone added!')
    }
    setShowForm(false)
    setEditIndex(null)
    setForm({ postcode: '', minOrder: 10, deliveryFee: 1.99 })
  }

  const openEdit = (zone: Zone, index: number) => {
    setEditIndex(index)
    setForm({ ...zone })
    setShowForm(true)
  }

  const remove = (index: number) => {
    setZones((prev) => prev.filter((_, i) => i !== index))
    toast.success('Zone removed')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Delivery Management</h1>
        <button onClick={() => { setShowForm(true); setEditIndex(null) }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Add Zone
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editIndex !== null ? 'Edit Zone' : 'New Delivery Zone'}</h2>
            <button onClick={() => { setShowForm(false); setEditIndex(null) }}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode Prefix *</label>
              <input value={form.postcode} onChange={(e) => setForm((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="TW18" />
              <p className="text-xs text-gray-400 mt-1">e.g. TW18 covers all TW18 postcodes</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Minimum Order (£)</label>
              <input type="number" step="0.01" value={form.minOrder} onChange={(e) => setForm((p) => ({ ...p, minOrder: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Fee (£)</label>
              <input type="number" step="0.01" value={form.deliveryFee} onChange={(e) => setForm((p) => ({ ...p, deliveryFee: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={save} className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">Save Zone</button>
            <button onClick={() => { setShowForm(false); setEditIndex(null) }} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Postcode Prefix</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Min Order</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Delivery Fee</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {zones.map((z, i) => (
              <tr key={z.postcode + i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-bold text-gray-900 font-mono">{z.postcode}</td>
                <td className="px-4 py-3 text-gray-700">£{z.minOrder.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-700">£{z.deliveryFee.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(z, i)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => remove(i)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
