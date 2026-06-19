import Link from 'next/link'
import Image from 'next/image'
import { Tag, Clock } from 'lucide-react'
import { activeCoupons, products } from '@/lib/menu-data'
import { formatPrice } from '@/lib/utils'

export const metadata = { title: 'Special Offers | Pizza Guys' }

export default function OffersPage() {
  const deals = products.filter((p) => p.category === 'pizza-deals' || p.category === 'pizza-meal' || p.category === 'lunch-offers')

  return (
    <div>
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-16 px-4 sm:px-6 text-center">
        <h1 className="text-4xl font-black mb-3">Special Offers</h1>
        <p className="text-red-100 max-w-xl mx-auto">Save big with our exclusive deals and limited-time promotions</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Coupon codes */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><Tag size={20} className="text-red-600" /> Coupon Codes</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {activeCoupons.map((coupon) => (
              <div key={coupon.code} className="bg-white rounded-2xl border-2 border-dashed border-red-200 p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-red-50 rounded-full" />
                <div className="relative">
                  <div className="text-3xl font-black text-red-600 mb-2">
                    {coupon.type === 'percentage' && `${coupon.value}% OFF`}
                    {coupon.type === 'fixed' && `£${coupon.value} OFF`}
                    {coupon.type === 'freeDelivery' && 'FREE DEL.'}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{coupon.description}</p>
                  <p className="text-xs text-gray-400 mb-3">Min. order: {formatPrice(coupon.minOrder)}</p>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500">Code:</span>
                    <span className="font-black text-gray-900 tracking-wider">{coupon.code}</span>
                  </div>
                  <Link href="/cart" className="mt-3 block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-sm text-center transition-colors">
                    Use Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deal bundles */}
        <section className="mb-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">Crazy Deals &amp; Bundles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative aspect-[4/3]">
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">DEAL</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-red-600 text-lg">{formatPrice(product.price)}</span>
                    <Link href="/menu" className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors">
                      Order
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lunch offers */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={20} className="text-amber-600" />
            <div>
              <h2 className="font-black text-gray-900">Lunch Time Offers</h2>
              <p className="text-amber-700 text-sm">Available Monday to Friday, 11:00am – 4:00pm only</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Beat the lunch rush with our specially priced lunch deals. Every meal includes a main, fries, and a regular drink at an unbeatable price.
          </p>
          <Link href="/menu?category=lunch-offers" className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
            View Lunch Menu
          </Link>
        </section>
      </div>
    </div>
  )
}
