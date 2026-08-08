'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Loader2, ChevronUp, ChevronDown, Timer } from 'lucide-react'
import toast from 'react-hot-toast'

type Preset = { id: string; minutes: number; sortOrder: number }

export default function AdminPrepTimesPage() {
  const [presets, setPresets]   = useState<Preset[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [minutes, setMinutes]   = useState(15)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/prep-time-presets')
      const data = await res.json()
      setPresets(data.presets ?? [])
    } catch { toast.error('Failed to load preparation times') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openEdit = (preset: Preset) => {
    setEditId(preset.id)
    setMinutes(preset.minutes)
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setMinutes(15) }

  const save = async () => {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 360) {
      toast.error('Enter a whole number of minutes between 1 and 360')
      return
    }
    setSaving(true)
    try {
      const res = editId
        ? await fetch(`/api/admin/prep-time-presets/${editId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minutes }),
          })
        : await fetch('/api/admin/prep-time-presets', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ minutes }),
          })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? 'Failed to save')
        return
      }
      toast.success(editId ? 'Time updated!' : 'Time added!')
      closeForm(); load()
    } finally { setSaving(false) }
  }

  const move = async (preset: Preset, direction: 'up' | 'down') => {
    const res = await fetch(`/api/admin/prep-time-presets/${preset.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ move: direction }),
    })
    if (res.ok) load()
    else toast.error('Could not reorder')
  }

  const remove = async (preset: Preset) => {
    if (!confirm(`Remove the ${preset.minutes} minute button?`)) return
    const res = await fetch(`/api/admin/prep-time-presets/${preset.id}`, { method: 'DELETE' })
    if (res.ok) { setPresets((p) => p.filter((x) => x.id !== preset.id)); toast.success('Time removed') }
    else toast.error('Could not remove')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Preparation Times</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          These are the buttons staff choose from when accepting an order. The chosen time is split evenly
          across the preparation steps, and the order moves through them automatically.
        </p>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Time
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editId ? 'Edit Time' : 'New Time Button'}</h2>
            <button onClick={closeForm}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="mb-4 max-w-xs">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Minutes</label>
            <input
              type="number" step="1" min="1" max="360"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} {editId ? 'Update Time' : 'Add Time'}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {presets.map((preset, i) => (
                <tr key={preset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => move(preset, 'up')}
                        disabled={i === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        onClick={() => move(preset, 'down')}
                        disabled={i === presets.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-2">
                    <Timer size={14} className="text-gray-300" /> {preset.minutes} minutes
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(preset)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => remove(preset)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {presets.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">No preparation times configured — add one above, e.g. 20 minutes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
