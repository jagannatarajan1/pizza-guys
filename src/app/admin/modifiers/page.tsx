'use client'
import { useState } from 'react'
import { Plus, ChevronDown, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

type ModOption = { id: string; name: string; price: number }
type ModGroup = { id: string; name: string; required: boolean; multiSelect: boolean; min: number; max: number; options: ModOption[] }

const INITIAL_GROUPS: ModGroup[] = [
  { id: 'pizza-size', name: 'Choose Your Size', required: true, multiSelect: false, min: 1, max: 1, options: [
    { id: 's1', name: '9" Personal', price: 0 }, { id: 's2', name: '12" Medium', price: 3 }, { id: 's3', name: '15" Large', price: 6 }, { id: 's4', name: '18" Extra Large', price: 9 },
  ]},
  { id: 'pizza-crust', name: 'Choose Your Crust', required: true, multiSelect: false, min: 1, max: 1, options: [
    { id: 'c1', name: 'Thin & Crispy', price: 0 }, { id: 'c2', name: 'Classic Hand Tossed', price: 0 }, { id: 'c3', name: 'Deep Pan', price: 0.5 }, { id: 'c4', name: 'Stuffed Crust', price: 1.5 },
  ]},
  { id: 'pizza-extras', name: 'Add Extras', required: false, multiSelect: true, min: 0, max: 5, options: [
    { id: 'e1', name: 'Extra Cheese', price: 1 }, { id: 'e2', name: 'Jalapeños', price: 0.5 }, { id: 'e3', name: 'Black Olives', price: 0.5 },
  ]},
]

export default function AdminModifiersPage() {
  const [groups, setGroups] = useState<ModGroup[]>(INITIAL_GROUPS)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const addGroup = () => {
    if (!newGroupName.trim()) { toast.error('Name required'); return }
    const newGroup: ModGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      required: false,
      multiSelect: false,
      min: 0,
      max: 1,
      options: [],
    }
    setGroups((prev) => [...prev, newGroup])
    setShowNewGroup(false)
    setNewGroupName('')
    toast.success('Modifier group created!')
  }

  const addOption = (groupId: string) => {
    setGroups((prev) => prev.map((g) => g.id === groupId ? {
      ...g,
      options: [...g.options, { id: `opt-${Date.now()}`, name: 'New Option', price: 0 }],
    } : g))
  }

  const updateOption = (groupId: string, optId: string, key: 'name' | 'price', value: string | number) => {
    setGroups((prev) => prev.map((g) => g.id === groupId ? {
      ...g,
      options: g.options.map((o) => o.id === optId ? { ...o, [key]: value } : o),
    } : g))
  }

  const removeOption = (groupId: string, optId: string) => {
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optId) } : g))
  }

  const removeGroup = (id: string) => {
    if (!confirm('Delete this modifier group?')) return
    setGroups((prev) => prev.filter((g) => g.id !== id))
    toast.success('Group deleted')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Modifiers</h1>
        <button onClick={() => setShowNewGroup(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> New Group
        </button>
      </div>

      {showNewGroup && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex gap-3">
          <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name (e.g. Choose Your Sauce)" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
          <button onClick={addGroup} className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">Create</button>
          <button onClick={() => setShowNewGroup(false)} className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === group.id ? null : group.id)}
            >
              <div className="flex-1">
                <div className="font-bold text-gray-900">{group.name}</div>
                <div className="text-xs text-gray-500">
                  {group.required ? 'Required' : 'Optional'} · {group.options.length} options · {group.multiSelect ? 'Multi-select' : 'Single select'}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeGroup(group.id) }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded === group.id ? 'rotate-180' : ''}`} />
            </div>

            {expanded === group.id && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                <div className="flex gap-4 mb-4 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={group.required} onChange={(e) => setGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, required: e.target.checked } : g))} />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={group.multiSelect} onChange={(e) => setGroups((prev) => prev.map((g) => g.id === group.id ? { ...g, multiSelect: e.target.checked } : g))} />
                    <span className="text-sm text-gray-700">Multi-select</span>
                  </label>
                </div>

                <div className="space-y-2 mb-3">
                  {group.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        value={opt.name}
                        onChange={(e) => updateOption(group.id, opt.id, 'name', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-400"
                        placeholder="Option name"
                      />
                      <div className="relative w-24">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">+£</span>
                        <input
                          type="number"
                          step="0.01"
                          value={opt.price}
                          onChange={(e) => updateOption(group.id, opt.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-200 rounded-lg pl-7 pr-2 py-1.5 text-sm focus:outline-none focus:border-red-400"
                        />
                      </div>
                      <button onClick={() => removeOption(group.id, opt.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => addOption(group.id)} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700">
                    <Plus size={13} /> Add Option
                  </button>
                  <button onClick={() => toast.success('Group saved!')} className="ml-auto text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                    Save Group
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
