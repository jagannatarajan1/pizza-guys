'use client'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { products, categories } from '@/lib/menu-data'
import type { Product } from '@/lib/menu-data'
import { formatPrice } from '@/lib/utils'
import ProductModal from '@/components/ProductModal'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
}

function ProductItem({ product, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  return (
    <motion.div
      variants={fadeUp}
      onClick={() => onSelect(product)}
      className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-pointer card-hover group"
    >
      <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {product.popular && (
          <span className="absolute top-2 left-2 bg-[#FFD700] text-[#111] text-[10px] font-black px-2 py-0.5 rounded-full">
            Popular
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-black text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
        {product.allergens && product.allergens.length > 0 && (
          <p className="text-xs text-amber-600 mb-2">⚠️ {product.allergens.join(', ')}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="font-black text-gray-900 text-sm">
            {product.modifiers?.length ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(product) }}
            className="btn-brand px-4 py-1.5 rounded-lg text-sm shrink-0"
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function MenuContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
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
      const top = el.getBoundingClientRect().top + window.scrollY - 140
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    if (initialCategory !== 'all') {
      setTimeout(() => scrollToCategory(initialCategory), 100)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* ── Hero ─────────────────────────────────── */}
      <section className="relative bg-[#111] text-white overflow-hidden py-14 px-4 sm:px-6">
        <div className="absolute inset-0 bg-linear-to-r from-[#E53935]/15 via-[#111] to-[#FFD700]/10" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/30 text-[#FFD700] text-xs font-bold px-4 py-2 rounded-full mb-4"
          >
            🍕 Fresh to Order
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-3xl sm:text-4xl font-black mb-1"
          >
            Our <span className="text-[#FFD700]">Menu</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-gray-400"
          >
            Fresh, handmade food prepared to order
          </motion.p>
        </div>
      </section>

      {/* ── Sticky search + category nav ─────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory('all') }}
              placeholder="Search menu items..."
              className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-10 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
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

        {/* Category pills */}
        <div className="overflow-x-auto hide-scrollbar border-t border-gray-50">
          <div className="flex gap-1.5 px-4 sm:px-6 py-2.5 min-w-max">
            <button
              onClick={() => { setActiveCategory('all'); setSearch(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              className={`px-4 py-1.5 rounded-full text-sm font-black whitespace-nowrap transition-all duration-150 ${
                activeCategory === 'all'
                  ? 'bg-[#FFD700] text-[#111]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-sm font-black whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  activeCategory === cat.slug
                    ? 'bg-[#FFD700] text-[#111]'
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

      {/* ── Products ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {search && filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🍕</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">Try a different search term</p>
            <button onClick={() => setSearch('')} className="btn-brand px-5 py-2 rounded-xl text-sm">
              Clear Search
            </button>
          </div>
        ) : search ? (
          <div>
            <h2 className="text-lg font-black text-gray-900 mb-5">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for &quot;{search}&quot;
            </h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredProducts.map((product) => (
                <ProductItem key={product.id} product={product} onSelect={setSelectedProduct} />
              ))}
            </motion.div>
          </div>
        ) : (
          grouped.map(({ category, items }) => (
            <section
              key={category.id}
              ref={(el) => { sectionRefs.current[category.slug] = el }}
              className="mb-14"
            >
              <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-gray-100">
                <div className="w-11 h-11 bg-yellow-50 border-2 border-yellow-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{category.name}</h2>
                  <p className="text-xs text-gray-400 font-semibold">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-40px' }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {items.map((product) => (
                  <ProductItem key={product.id} product={product} onSelect={setSelectedProduct} />
                ))}
              </motion.div>
            </section>
          ))
        )}
      </div>
    </>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3">🍕</div>
          <div className="font-bold text-gray-500">Loading menu...</div>
        </div>
      </div>
    }>
      <MenuContent />
    </Suspense>
  )
}
