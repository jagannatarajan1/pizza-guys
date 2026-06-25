'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, Tag, ShoppingBag, ArrowLeft, Edit2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import ProductModal from '@/components/ProductModal'
import type { Product } from '@/lib/menu-data'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, couponCode, couponDiscount, deliveryFee, removeItem, updateQuantity, applyCoupon, removeCoupon, getSubtotal } = useCartStore()
  const [couponInput, setCouponInput]     = useState('')
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const subtotal = getSubtotal()
  const total = Math.max(0, subtotal - couponDiscount + deliveryFee)

  const handleApplyCoupon = async () => {
    const code = couponInput.toUpperCase().trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res  = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (!res.ok) { setCouponError(data.error ?? 'Invalid coupon'); return }
      // freeDelivery discount is applied at checkout (delivery fee waived)
      const discount = data.type === 'freeDelivery' ? 0 : data.discountAmount
      applyCoupon(code, discount)
      toast.success(`Coupon "${code}" applied!`)
    } catch {
      setCouponError('Could not validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your basket is empty</h2>
        <p className="text-gray-500 mb-6">Add some delicious items from our menu!</p>
        <Link href="/menu" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-colors inline-flex items-center gap-2">
          <ShoppingBag size={18} /> Browse Menu
        </Link>
      </div>
    )
  }

  return (
    <>
      {editingProduct && <ProductModal product={editingProduct} onClose={() => setEditingProduct(null)} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/menu" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-6">Your Basket ({items.reduce((s, i) => s + i.quantity, 0)} items)</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.cartId} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{item.product.name}</h3>
                    {item.modifiers.map((mod) => (
                      <p key={mod.groupId} className="text-xs text-gray-500 mt-0.5">
                        {mod.groupName}: {mod.options.map((o) => o.name).join(', ')}
                      </p>
                    ))}
                    {item.specialInstructions && (
                      <p className="text-xs text-amber-600 mt-0.5">📝 {item.specialInstructions}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{formatPrice(item.itemTotal)}</span>
                        <button
                          onClick={() => setEditingProduct(item.product)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit item"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => { removeItem(item.cartId); toast.success('Item removed') }}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag size={16} className="text-red-600" /> Coupon Code</h3>
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                  <div>
                    <span className="font-bold text-green-700">{couponCode}</span>
                    <p className="text-xs text-green-600">-{formatPrice(couponDiscount)} saved</p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-xs font-medium">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      {couponLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({couponCode})</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Proceed to Checkout
              </Link>
              <p className="text-center text-xs text-gray-400 mt-2">Secure checkout · SSL encrypted</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
