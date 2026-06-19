'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, EyeOff, Eye, GripVertical, X } from 'lucide-react'
import { categories as initialCats } from '@/lib/menu-data'
import type { Category } from '@/lib/menu-data'
import toast from 'react-hot-toast'

export default function AdminCategoriesPage() {
  const [cats, setCats] = useState<Category[]>([...initialCats].sort((a, b) => a.order - b.order))
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', icon: '🍽️', visible: true })

  const toggleVisible = (id: string) => {
    setCats((prev) => prev.map((c) => c.id === id ? { ...c, visible: !c.visible } : c))
    toast.success('Category updated')
  }

  const deleteCat = (id: string) => {
    if (!confirm('Delete this category?')) return
    setCats((prev) => prev.filter((c) => c.id !== id))
    toast.success('Category deleted')
  }

  const save = () => {
    if (!form.name) { toast.error('Name is required'); return }
    if (editId) {
      setCats((prev) => prev.map((c) => c.id === editId ? { ...c, ...form } : c))
      toast.success('Category updated!')
    } else {
      const newCat: Category = {
        id: form.name.toLowerCase().replace(/\s+/g, '-'),
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, '-'),
        icon: form.icon,
        visible: form.visible,
        order: cats.length + 1,
      }
      setCats((prev) => [...prev, newCat])
      toast.success('Category added!')
    }
    setShowForm(false)
    setEditId(null)
    setForm({ name: '', icon: '🍽️', visible: true })
  }

  const openEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, icon: cat.icon, visible: cat.visible })
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Categories</h1>
        <button onClick={() => { setShowForm(true); setEditId(null) }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editId ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null) }}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="e.g. Pizzas" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Icon (emoji)</label>
              <input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="🍕" />
            </div>
          </div>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm((p) => ({ ...p, visible: e.target.checked }))} />
            <span className="text-sm text-gray-700">Visible on website</span>
          </label>
          <div className="flex gap-3">
            <button onClick={save} className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">Save</button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {cats.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-400"><GripVertical size={14} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-500 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${cat.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.visible ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleVisible(cat.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                      {cat.visible ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                    <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => deleteCat(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
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
