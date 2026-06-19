'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Plus, Search, Pencil, Trash2, EyeOff, Eye, X } from 'lucide-react'
import { products as initialProducts, categories } from '@/lib/menu-data'
import type { Product } from '@/lib/menu-data'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'pizza', available: true })

  const filtered = productList.filter((p) => {
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'all' || p.category === catFilter
    return matchSearch && matchCat
  })

  const toggleAvailability = (id: string) => {
    setProductList((prev) => prev.map((p) => p.id === id ? { ...p, available: !p.available } : p))
    toast.success('Product updated')
  }

  const deleteProduct = (id: string) => {
    if (!confirm('Delete this product?')) return
    setProductList((prev) => prev.filter((p) => p.id !== id))
    toast.success('Product deleted')
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({ name: p.name, description: p.description, price: p.price.toString(), category: p.category, available: p.available })
    setShowForm(true)
  }

  const saveProduct = () => {
    if (!form.name || !form.price) { toast.error('Name and price required'); return }
    if (editProduct) {
      setProductList((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...form, price: parseFloat(form.price) } : p))
      toast.success('Product updated!')
    } else {
      const newProduct: Product = {
        id: `product-${Date.now()}`,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        available: form.available,
        image: '/images/Pizza/Margherita.avif',
      }
      setProductList((prev) => [...prev, newProduct])
      toast.success('Product added!')
    }
    setShowForm(false)
    setEditProduct(null)
    setForm({ name: '', description: '', price: '', category: 'pizza', available: true })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <button onClick={() => { setShowForm(true); setEditProduct(null) }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{editProduct ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={() => { setShowForm(false); setEditProduct(null) }}><X size={18} className="text-gray-400" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="e.g. Pepperoni Feast" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price (£) *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="9.99" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Available</label>
              <select value={form.available ? 'yes' : 'no'} onChange={(e) => setForm((p) => ({ ...p, available: e.target.value === 'yes' }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                <option value="yes">Available</option>
                <option value="no">Unavailable</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-none h-20" placeholder="Product description..." />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={saveProduct} className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors">Save Product</button>
            <button onClick={() => { setShowForm(false); setEditProduct(null) }} className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-400" />
        </div>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400">
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image src={p.image} alt={p.name} fill className="object-cover" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                        <div className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {categories.find((c) => c.id === p.category)?.name || p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.available ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleAvailability(p.id)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title={p.available ? 'Hide' : 'Show'}>
                        {p.available ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
