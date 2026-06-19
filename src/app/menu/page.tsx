'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { products, categories } from '@/lib/menu-data'
import type { Product } from '@/lib/menu-data'
import { formatPrice } from '@/lib/utils'
import ProductModal from '@/components/ProductModal'

function MenuContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const categoryNavRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  const visibleCategories = categories.filter((c) => c.visible)

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory
    return matchesSearch && matchesCategory && p.available
  })

  const grouped = visibleCategories
    .map((cat) => ({
      category: cat,
      items: filteredProducts.filter((p) => p.category === cat.id),
    }))
    .filter((g) => g.items.length > 0)

  const scrollToCategory = (slug: string) => {
    setActiveCategory(slug)
    const el = sectionRefs.current[slug]
    if (el) {
      const offset = 140
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (initialCategory !== 'all') {
      setTimeout(() => scrollToCategory(initialCategory), 100)
    }
  }, [])

  return (
    <>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* Page header */}
      <div className="bg-gray-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-black mb-2">Our Menu</h1>
          <p className="text-gray-400">Fresh, handmade food prepared to order</p>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory('all') }}
              placeholder="Search menu items..."
              className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category nav */}
        <div
          ref={categoryNavRef}
          className="overflow-x-auto hide-scrollbar border-t border-gray-50"
        >
          <div className="flex gap-1 px-4 sm:px-6 py-2 min-w-max">
            <button
              onClick={() => { setActiveCategory('all'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeCategory === cat.slug
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {search && filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🍕</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">Try a different search term</p>
            <button onClick={() => setSearch('')} className="mt-4 text-red-600 font-semibold hover:underline">
              Clear search
            </button>
          </div>
        ) : search ? (
          <div>
            <h2 className="text-xl font-black text-gray-900 mb-4">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for &quot;{search}&quot;
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductItem key={product.id} product={product} onSelect={setSelectedProduct} />
              ))}
            </div>
          </div>
        ) : (
          grouped.map(({ category, items }) => (
            <section
              key={category.id}
              ref={(el) => { sectionRefs.current[category.slug] = el }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{category.icon}</span>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{category.name}</h2>
                  <p className="text-sm text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((product) => (
                  <ProductItem key={product.id} product={product} onSelect={setSelectedProduct} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  )
}

function ProductItem({ product, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onSelect(product)}
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {product.popular && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Popular
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
        {product.allergens && product.allergens.length > 0 && (
          <p className="text-xs text-amber-600 mb-2">⚠️ {product.allergens.join(', ')}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">
            {product.modifiers?.length ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(product) }}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading menu...</div></div>}>
      <MenuContent />
    </Suspense>
  )
}
