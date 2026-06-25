'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, Trash2, X, Loader2, Pencil, Check } from 'lucide-react'
import toast from 'react-hot-toast'

type ModOption = { id: string; name: string; price: number; sortOrder: number }
type ModGroup  = { id: string; name: string; required: boolean; multiSelect: boolean; min: number; max: number; options: ModOption[] }

const emptyGroupForm = { name: '', required: false, multiSelect: false, min: 0, max: 1 }

export default function AdminModifiersPage() {
  const [groups, setGroups]           = useState<ModGroup[]>([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [groupForm, setGroupForm]     = useState(emptyGroupForm)
  const [editGroupId, setEditGroupId] = useState<string | null>(null)
  const [saving, setSaving]           = useState(false)
  const [newOptName, setNewOptName]   = useState<Record<string, string>>({})
  const [newOptPrice, setNewOptPrice] = useState<Record<string, string>>({})
  const [editOptId, setEditOptId]     = useState<string | null>(null)
  const [editOptVal, setEditOptVal]   = useState({ name: '', price: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/modifier-groups')
      const data = await res.json()
      setGroups(data.groups ?? [])
    } catch { toast.error('Failed to load modifier groups') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNewGroup = () => { setGroupForm(emptyGroupForm); setEditGroupId(null); setShowNewGroup(true) }
  const openEditGroup = (g: ModGroup) => {
    setGroupForm({ name: g.name, required: g.required, multiSelect: g.multiSelect, min: g.min, max: g.max })
    setEditGroupId(g.id)
    setShowNewGroup(true)
  }

  const saveGroup = async () => {
    if (!groupForm.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      if (editGroupId) {
        const res = await fetch(`/api/admin/modifier-groups/${editGroupId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groupForm),
        })
        if (!res.ok) { toast.error('Failed to update'); return }
        toast.success('Group updated')
      } else {
        const res = await fetch('/api/admin/modifier-groups', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groupForm),
        })
        if (!res.ok) { toast.error('Failed to create'); return }
        toast.success('Group created')
      }
      setShowNewGroup(false)
      load()
    } finally { setSaving(false) }
  }

  const deleteGroup = async (id: string) => {
    if (!confirm('Delete this modifier group and all its options?')) return
    const res = await fetch(`/api/admin/modifier-groups/${id}`, { method: 'DELETE' })
    if (res.ok) { setGroups((p) => p.filter((g) => g.id !== id)); toast.success('Group deleted') }
  }

  const addOption = async (groupId: string) => {
    const name  = (newOptName[groupId] ?? '').trim()
    const price = parseFloat(newOptPrice[groupId] ?? '0') || 0
    if (!name) { toast.error('Option name required'); return }
    const res = await fetch(`/api/admin/modifier-groups/${groupId}/options`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, price }),
    })
    if (!res.ok) { toast.error('Failed to add option'); return }
    const { option } = await res.json()
    setGroups((p) => p.map((g) => g.id === groupId ? { ...g, options: [...g.options, option] } : g))
    setNewOptName((p) => ({ ...p, [groupId]: '' }))
    setNewOptPrice((p) => ({ ...p, [groupId]: '' }))
  }

  const startEditOpt = (opt: ModOption) => {
    setEditOptId(opt.id)
    setEditOptVal({ name: opt.name, price: String(opt.price) })
  }

  const saveEditOpt = async (groupId: string, optId: string) => {
    const price = parseFloat(editOptVal.price) || 0
    const res = await fetch(`/api/admin/modifier-groups/${groupId}/options/${optId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editOptVal.name, price }),
    })
    if (!res.ok) { toast.error('Failed to update option'); return }
    const { option } = await res.json()
    setGroups((p) => p.map((g) => g.id === groupId ? { ...g, options: g.options.map((o) => o.id === optId ? option : o) } : g))
    setEditOptId(null)
  }

  const deleteOption = async (groupId: string, optId: string) => {
    const res = await fetch(`/api/admin/modifier-groups/${groupId}/options/${optId}`, { method: 'DELETE' })
    if (res.ok) {
      setGroups((p) => p.map((g) => g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optId) } : g))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Modifier Groups</h1>
          <p className="text-sm text-gray-500 mt-0.5">Size, crust, extras and other customisation options for your products</p>
        </div>
        <button
          onClick={openNewGroup}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> New Group
        </button>
      </div>

      {showNewGroup && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editGroupId ? 'Edit Group' : 'New Modifier Group'}</h2>
            <button onClick={() => setShowNewGroup(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name *</label>
              <input
                value={groupForm.name}
                onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                placeholder="e.g. Choose Your Size"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min selections</label>
              <input type="number" min="0"
                value={groupForm.min}
                onChange={(e) => setGroupForm((p) => ({ ...p, min: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max selections</label>
              <input type="number" min="1"
                value={groupForm.max}
                onChange={(e) => setGroupForm((p) => ({ ...p, max: parseInt(e.target.value) || 1 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={groupForm.required} onChange={(e) => setGroupForm((p) => ({ ...p, required: e.target.checked }))} className="accent-red-600" />
              <span className="text-sm font-medium text-gray-700">Required (customer must choose)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={groupForm.multiSelect} onChange={(e) => setGroupForm((p) => ({ ...p, multiSelect: e.target.checked }))} className="accent-red-600" />
              <span className="text-sm font-medium text-gray-700">Allow multiple selections</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button onClick={saveGroup} disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />} {editGroupId ? 'Update Group' : 'Create Group'}
            </button>
            <button onClick={() => setShowNewGroup(false)} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === group.id ? null : group.id)}
              >
                <span className="text-gray-400">
                  {expanded === group.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
                <span className="font-bold text-gray-900 flex-1">{group.name}</span>
                <div className="flex items-center gap-1.5 text-xs">
                  {group.required && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-lg font-medium">Required</span>}
                  {group.multiSelect && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-medium">Multi-select</span>}
                  <span className="text-gray-400">{group.options.length} option{group.options.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEditGroup(group)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => deleteGroup(group.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>

              {expanded === group.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <div className="space-y-1.5 mb-4">
                    {group.options.length === 0 && (
                      <p className="text-sm text-gray-400 py-2">No options yet — add one below</p>
                    )}
                    {group.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2 group/opt">
                        {editOptId === opt.id ? (
                          <>
                            <input
                              value={editOptVal.name}
                              onChange={(e) => setEditOptVal((p) => ({ ...p, name: e.target.value }))}
                              className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400"
                            />
                            <div className="flex items-center gap-1 w-24">
                              <span className="text-gray-400 text-sm">£</span>
                              <input
                                value={editOptVal.price}
                                onChange={(e) => setEditOptVal((p) => ({ ...p, price: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400"
                                type="number" step="0.01" min="0"
                              />
                            </div>
                            <button onClick={() => saveEditOpt(group.id, opt.id)} className="p-1 text-green-600 hover:text-green-700"><Check size={15} /></button>
                            <button onClick={() => setEditOptId(null)} className="p-1 text-gray-400 hover:text-gray-600"><X size={15} /></button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-800">{opt.name}</span>
                            <span className="text-sm text-gray-500 w-20 text-right">{opt.price > 0 ? `+£${opt.price.toFixed(2)}` : 'included'}</span>
                            <div className="flex gap-0.5 opacity-0 group-hover/opt:opacity-100 transition-opacity">
                              <button onClick={() => startEditOpt(opt)} className="p-1 text-gray-400 hover:text-orange-600 transition-colors"><Pencil size={13} /></button>
                              <button onClick={() => deleteOption(group.id, opt.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 border-t border-dashed border-gray-200 pt-3">
                    <input
                      value={newOptName[group.id] ?? ''}
                      onChange={(e) => setNewOptName((p) => ({ ...p, [group.id]: e.target.value }))}
                      placeholder="Option name"
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400"
                      onKeyDown={(e) => { if (e.key === 'Enter') addOption(group.id) }}
                    />
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-gray-400 text-sm">£</span>
                      <input
                        value={newOptPrice[group.id] ?? ''}
                        onChange={(e) => setNewOptPrice((p) => ({ ...p, [group.id]: e.target.value }))}
                        placeholder="0.00"
                        type="number" step="0.01" min="0"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400"
                        onKeyDown={(e) => { if (e.key === 'Enter') addOption(group.id) }}
                      />
                    </div>
                    <button
                      onClick={() => addOption(group.id)}
                      className="flex items-center gap-1 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {groups.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-1">No modifier groups yet</p>
              <p className="text-sm">Create groups like &quot;Choose Your Size&quot; or &quot;Add Extras&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
