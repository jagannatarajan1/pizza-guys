'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Plus, Search, Pencil, Trash2, EyeOff, Eye, X, Loader2, Copy } from 'lucide-react'
import type { Category } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'
import toast from 'react-hot-toast'

type DBProduct = {
  id: string
  name: string
  description: string
  price: number        // in pounds (normalized by API)
  image: string
  category: string
  popular: boolean
  available: boolean
  allergens: string[]
  createdAt: string
}

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'pizza',
  image: '',
  popular: false,
  available: true,
}

export default function AdminProductsPage() {
  const [products, setProducts]   = useState<DBProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<string | null>(null)
  const [form, setForm]           = useState(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/menu/categories'),
      ])
      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()])
      setProducts(pData.products ?? [])
      setCategories(cData.categories ?? [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter((p) => {
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = catFilter === 'all' || p.category === catFilter
    return matchSearch && matchCat
  })

  const openAdd = () => {
    setEditId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (p: DBProduct) => {
    setEditId(p.id)
    setForm({
      name:        p.name,
      description: p.description,
      price:       p.price.toFixed(2),
      category:    p.category,
      image:       p.image,
      popular:     p.popular,
      available:   p.available,
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm) }

  const saveProduct = async () => {
    if (!form.name.trim() || !form.price) { toast.error('Name and price are required'); return }
    setSaving(true)
    try {
      const url    = editId ? `/api/admin/products/${editId}` : '/api/admin/products'
      const method = editId ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { toast.error('Failed to save product'); return }
      toast.success(editId ? 'Product updated!' : 'Product added!')
      closeForm()
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailability = async (p: DBProduct) => {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !p.available }),
    })
    if (res.ok) {
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, available: !p.available } : x))
      toast.success(p.available ? 'Product hidden' : 'Product shown')
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Product deleted')
    }
  }

  const duplicateProduct = async (p: DBProduct) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${p.name} (Copy)`,
        description: p.description,
        price: p.price.toString(),
        category: p.category,
        image: p.image,
        popular: false,
        available: false,
      }),
    })
    if (res.ok) { toast.success('Product duplicated — set it to Available when ready'); load() }
    else toast.error('Failed to duplicate product')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">
          Products
          {!loading && <span className="ml-2 text-sm font-semibold text-gray-400">({products.length})</span>}
        </h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 text-[#111] font-black px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border-2 border-[#FFD700] p-6 mb-6 shadow-lg shadow-yellow-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-black text-gray-900 text-lg">{editId ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={closeForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Product Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
                  placeholder="e.g. Pepperoni Feast"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Base Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
                >
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm((p) => ({ ...p, available: e.target.checked }))}
                    className="w-4 h-4 accent-[#FFD700]"
                  />
                  <span className="text-sm font-bold text-gray-700">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(e) => setForm((p) => ({ ...p, popular: e.target.checked }))}
                    className="w-4 h-4 accent-[#FFD700]"
                  />
                  <span className="text-sm font-bold text-gray-700">Mark as Popular</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors resize-none h-24"
                  placeholder="Product description..."
                />
              </div>
            </div>

            {/* Right column — image upload */}
            <div>
              <ImageUpload
                value={form.image}
                onChange={(url) => setForm((p) => ({ ...p, image: url }))}
                label="Product Image"
              />
              {form.image && (
                <p className="text-xs text-green-600 font-semibold mt-2">✅ Image uploaded to Cloudinary</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-5 border-t border-gray-100">
            <button
              onClick={saveProduct}
              disabled={saving}
              className="flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 disabled:opacity-50 text-[#111] font-black px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Product'}
            </button>
            <button
              onClick={closeForm}
              className="bg-gray-100 text-gray-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#FFD700]"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#FFD700]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Loader2 size={20} className="animate-spin" /> Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🍕</div>
            <p className="font-black text-gray-900 mb-1">{products.length === 0 ? 'No products yet' : 'No results'}</p>
            <p className="text-gray-400 text-sm">
              {products.length === 0 ? 'Click "Add Product" to add your first item.' : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">🍕</div>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                            {p.name}
                            {p.popular && (
                              <span className="text-[10px] bg-[#FFD700] text-[#111] font-black px-1.5 py-0.5 rounded-full">Popular</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{p.description || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">
                        {categories.find((c) => c.id === p.category)?.name || p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-gray-900">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.available ? 'Available' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleAvailability(p)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title={p.available ? 'Hide' : 'Show'}
                        >
                          {p.available ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => duplicateProduct(p)} className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors" title="Duplicate">
                          <Copy size={15} />
                        </button>
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
