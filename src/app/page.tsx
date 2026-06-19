'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Clock, ChevronRight, Star, Truck, Award, Heart, Zap } from 'lucide-react'
import { categories, popularProducts, activeCoupons, openingHours, deliveryZones } from '@/lib/menu-data'
import { checkDelivery, isOpen, formatPrice } from '@/lib/utils'
import ProductModal from '@/components/ProductModal'
import type { Product } from '@/lib/menu-data'

export default function HomePage() {
  const [postcode, setPostcode] = useState('')
  const [deliveryResult, setDeliveryResult] = useState<{ available: boolean; fee: number; minOrder: number } | null | 'not-found'>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const { isOpen: open, todayHours } = isOpen(openingHours)

  const handleDeliveryCheck = () => {
    if (!postcode.trim()) return
    const result = checkDelivery(postcode, deliveryZones)
    setDeliveryResult(result ?? 'not-found')
  }

  return (
    <>
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/Pizza/Meat feast.avif')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 text-red-300 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span>🔥</span> Hot &amp; Fresh Since 2009
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
              Real Pizza.<br />
              <span className="text-red-400">Real Good.</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Handmade pizzas, sizzling burgers &amp; fresh kebabs delivered hot to your door in Staines &amp; surrounding areas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/menu"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors inline-flex items-center gap-2"
              >
                Order Now <ChevronRight size={20} />
              </Link>
              <Link
                href="/menu"
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                View Menu
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-8 text-sm text-gray-400">
              <div className="flex items-center gap-2"><Truck size={16} className="text-red-400" /> Fast delivery</div>
              <div className="flex items-center gap-2"><Star size={16} className="text-yellow-400" /> 4.8 star rating</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-green-400" /> 30-45 min avg</div>
            </div>
          </div>
        </div>
      </section>

      {/* DELIVERY CHECKER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-red-600" /> Check Delivery Availability
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleDeliveryCheck()}
              placeholder="Enter your postcode (e.g. TW18 1AB)"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400"
            />
            <button
              onClick={handleDeliveryCheck}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Check
            </button>
          </div>
          {deliveryResult === 'not-found' && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
              ❌ Sorry, we don&apos;t deliver to your area yet. You can still collect in-store!
            </div>
          )}
          {deliveryResult && deliveryResult !== 'not-found' && (
            <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
              ✅ Great news! We deliver to your area. Delivery fee: {formatPrice(deliveryResult.fee)} · Min order: {formatPrice(deliveryResult.minOrder)}
            </div>
          )}
        </div>
      </section>

      {/* OPEN/CLOSED STATUS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium ${open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${open ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          {open ? `We're Open Now · Today: ${todayHours}` : `We're Currently Closed · Today: ${todayHours}`}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Browse Menu</h2>
            <p className="text-gray-500 text-sm mt-1">Find what you&apos;re craving</p>
          </div>
          <Link href="/menu" className="text-red-600 font-semibold text-sm hover:underline flex items-center gap-1">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.filter((c) => c.visible).slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              href={`/menu?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Most Popular</h2>
            <p className="text-gray-500 text-sm mt-1">Our customers can&apos;t get enough of these</p>
          </div>
          <Link href="/menu" className="text-red-600 font-semibold text-sm hover:underline flex items-center gap-1">
            See All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {popularProducts.slice(0, 8).map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setSelectedProduct(product)}>
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Popular</div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 text-sm">
                    {product.modifiers?.length ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(product) }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OFFERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Special Offers</h2>
            <p className="text-gray-500 text-sm mt-1">Save more with our exclusive deals</p>
          </div>
          <Link href="/offers" className="text-red-600 font-semibold text-sm hover:underline flex items-center gap-1">
            All Offers <ChevronRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeCoupons.map((coupon) => (
            <div key={coupon.code} className="bg-gradient-to-br from-red-600 to-red-800 text-white p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
              <div className="absolute right-8 bottom-0 w-16 h-16 bg-white/5 rounded-full -mb-8" />
              <div className="relative">
                <div className="text-2xl font-black mb-1">
                  {coupon.type === 'percentage' && `${coupon.value}% OFF`}
                  {coupon.type === 'fixed' && `£${coupon.value} OFF`}
                  {coupon.type === 'freeDelivery' && 'FREE DELIVERY'}
                </div>
                <p className="text-red-100 text-sm mb-4">{coupon.description}</p>
                <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-white/70">Code:</span>
                  <span className="font-black tracking-wider">{coupon.code}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900">Why Choose Pizza Guys?</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Zap className="text-yellow-500" size={28} />, title: 'Lightning Fast', desc: '30–45 min average delivery' },
            { icon: <Star className="text-red-500" size={28} />, title: 'Top Rated', desc: '4.8★ from 2,000+ reviews' },
            { icon: <Heart className="text-pink-500" size={28} />, title: 'Fresh Ingredients', desc: 'Prepared fresh every day' },
            { icon: <Award className="text-blue-500" size={28} />, title: 'Since 2009', desc: 'Trusted by local families' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-2xl p-5 text-center border border-gray-100">
              <div className="flex justify-center mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OPENING HOURS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14 mb-4">
        <div className="bg-gray-900 text-white rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-black mb-2">Opening Hours</h2>
              <p className="text-gray-400 text-sm">Order online any time, we&apos;ll confirm when we&apos;re open</p>
              <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${open ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {open ? 'Open Now' : 'Currently Closed'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {openingHours.map((h) => (
                <div key={h.day} className="flex gap-4">
                  <span className="text-gray-400 w-12 shrink-0">{h.day.slice(0, 3)}</span>
                  <span className="font-medium">{h.closed ? 'Closed' : `${h.open}–${h.close}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
