'use client'
import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, EyeOff, Eye, GripVertical, X, Loader2, Copy, Check } from 'lucide-react'
import type { Category, Product } from '@/lib/types'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'
import CategoryIcon from '@/components/CategoryIcon'

export default function AdminCategoriesPage() {
  const [cats, setCats]         = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [form, setForm]         = useState({ name: '', icon: '🍽️', image: '', visible: true })

  const load = async () => {
    setLoading(true)
    const res  = await fetch('/api/admin/categories')
    const data = await res.json()
    setCats(data.categories ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => {})
  }, [])

  // Product photos to pick a category image from — prefer products already in
  // this category, but fall back to every product so a new category still has
  // something to choose from.
  const pickableImages = useMemo(() => {
    const withImage = products.filter((p) => p.image)
    const inCategory = editId ? withImage.filter((p) => p.category === editId) : []
    const pool = inCategory.length > 0 ? inCategory : withImage
    const seen = new Set<string>()
    return pool.filter((p) => (seen.has(p.image) ? false : (seen.add(p.image), true)))
  }, [products, editId])

  const toggleVisible = async (cat: Category) => {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !cat.visible }),
    })
    if (res.ok) {
      setCats((prev) => prev.map((c) => c.id === cat.id ? { ...c, visible: !c.visible } : c))
      toast.success(cat.visible ? 'Category hidden' : 'Category visible')
    }
  }

  const duplicateCat = async (cat: Category) => {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${cat.name} (Copy)`, icon: cat.icon, visible: false }),
    })
    if (res.ok) { toast.success('Category duplicated — edit the name and enable when ready'); load() }
    else toast.error('Failed to duplicate')
  }

  const deleteCat = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will not be deleted.')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCats((prev) => prev.filter((c) => c.id !== id))
      toast.success('Category deleted')
    }
  }

  const openEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({ name: cat.name, icon: cat.icon, image: cat.image ?? '', visible: cat.visible })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setForm({ name: '', icon: '🍽️', image: '', visible: true }) }

  const save = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch(`/api/admin/categories/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { toast.error('Failed to save'); return }
        toast.success('Category updated!')
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { toast.error('Failed to create'); return }
        toast.success('Category added!')
      }
      closeForm()
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cats.length} categories in database</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null) }}
          className="flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 text-[#111] font-black px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-[#FFD700] p-5 mb-5 shadow-lg shadow-yellow-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900">{editId ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={closeForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-gray-700 mb-1.5">Category Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
                placeholder="e.g. Pizzas"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1.5">Icon (emoji fallback)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
                placeholder="🍕"
              />
            </div>
          </div>
          <div className="mb-4">
            <ImageUpload
              value={form.image}
              onChange={(url) => setForm((p) => ({ ...p, image: url }))}
              label="Category Image (used instead of the emoji when set)"
            />
          </div>

          {pickableImages.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-black text-gray-700 mb-1.5">
                Or pick from {editId ? 'this category\'s' : 'existing'} product photos
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pickableImages.map((p) => {
                  const selected = form.image === p.image
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image: p.image }))}
                      title={p.name}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                        selected ? 'border-[#FFD700]' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      {p.image ? (
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100">🍕</div>
                      )}
                      {selected && (
                        <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <Check size={18} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm((p) => ({ ...p, visible: e.target.checked }))}
              className="w-4 h-4 accent-yellow-400"
            />
            <span className="text-sm font-bold text-gray-700">Visible on website</span>
          </label>
          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 text-[#111] font-black px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Category'}
            </button>
            <button onClick={closeForm} className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Loading categories...
          </div>
        ) : cats.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📂</div>
            <p className="font-black text-gray-900 mb-1">No categories yet</p>
            <p className="text-gray-400 text-sm mb-4">Click "Add Category" or run the seed to get started</p>
          </div>
        ) : (
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
                  <td className="px-4 py-3 text-gray-300"><GripVertical size={14} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 shrink-0">
                        <CategoryIcon slug={cat.slug} icon={cat.icon} image={cat.image} size={32} className="rounded-lg" emojiClassName="text-xl" />
                      </div>
                      <span className="font-bold text-gray-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-400 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${cat.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleVisible(cat)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title={cat.visible ? 'Hide' : 'Show'}>
                        {cat.visible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => duplicateCat(cat)} className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors" title="Duplicate"><Copy size={15} /></button>
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => deleteCat(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
