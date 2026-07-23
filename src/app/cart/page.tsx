'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, Tag, ShoppingBag, ArrowLeft, SlidersHorizontal } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import ProductModal from '@/components/ProductModal'
import type { Product } from '@/lib/types'
import toast from 'react-hot-toast'

type AvailableCoupon = { code: string; type: 'percentage' | 'fixed' | 'freeDelivery'; value: number; minOrder: number; description: string }

function couponLabel(c: { type: string; value: number }) {
  if (c.type === 'percentage')   return `${c.value}% off`
  if (c.type === 'fixed')        return `${formatPrice(c.value)} off`
  return 'Free delivery'
}

export default function CartPage() {
  const {
    items, couponCode, couponType, couponMinOrder, deliveryFee,
    removeItem, updateQuantity, applyCoupon, removeCoupon, getSubtotal, getEffectiveDiscount,
  } = useCartStore()
  const [couponInput, setCouponInput]     = useState('')
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([])

  const subtotal = getSubtotal()
  const effectiveDiscount = getEffectiveDiscount()
  const total = Math.max(0, subtotal - effectiveDiscount + deliveryFee)

  useEffect(() => {
    fetch('/api/coupons').then((r) => r.json()).then((d) => setAvailableCoupons(d.coupons ?? [])).catch(() => {})
  }, [])

  // If the cart total drops below whatever an applied coupon requires (items
  // removed/quantities reduced), the coupon no longer qualifies — take it off
  // automatically and recompute the total, rather than silently over-discounting.
  useEffect(() => {
    if (couponCode && couponMinOrder > 0 && subtotal < couponMinOrder) {
      removeCoupon()
      toast.error(`Coupon "${couponCode}" removed — minimum order of ${formatPrice(couponMinOrder)} no longer met`)
    }
  }, [subtotal, couponCode, couponMinOrder, removeCoupon])

  const applyCode = async (code: string) => {
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
      applyCoupon(code, data.discountAmount, data.type, data.minOrder)
      setCouponInput('')
      toast.success(`Coupon "${code}" applied!`)
    } catch {
      setCouponError('Could not validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleApplyCoupon = () => {
    const code = couponInput.toUpperCase().trim()
    if (code) applyCode(code)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
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
        <h1 className="text-2xl font-black text-gray-900 mb-6">Your Cart ({items.reduce((s, i) => s + i.quantity, 0)} items)</h1>

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
                    {item.modifiers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.modifiers.flatMap((mod) =>
                          mod.options.map((o) => (
                            <span key={`${mod.groupId}-${o.id}`} className="text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                              {o.name}{o.price > 0 && <span className="text-gray-400"> +{formatPrice(o.price)}</span>}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <p className="text-xs text-amber-600 mt-1.5">📝 {item.specialInstructions}</p>
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
                          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-100 hover:bg-blue-50 rounded-lg px-2.5 py-1.5 transition-colors"
                        >
                          <SlidersHorizontal size={12} /> Customize Item
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
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Tag size={16} className="text-red-600" /> Coupons & Offers</h3>
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
                  <div>
                    <span className="font-bold text-green-700">{couponCode}</span>
                    <p className="text-xs text-green-600">
                      {couponType === 'freeDelivery' ? 'Free delivery applied' : `-${formatPrice(effectiveDiscount)} saved`}
                    </p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-xs font-medium">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableCoupons.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Available Coupons</p>
                      {availableCoupons.map((c) => {
                        const eligible = subtotal >= c.minOrder
                        return (
                          <div
                            key={c.code}
                            className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${eligible ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-sm ${eligible ? 'text-green-700' : 'text-gray-500'}`}>{c.code}</span>
                                <span className={`text-xs font-semibold ${eligible ? 'text-green-600' : 'text-gray-400'}`}>{couponLabel(c)}</span>
                              </div>
                              <p className={`text-xs mt-0.5 ${eligible ? 'text-green-600' : 'text-gray-400'}`}>
                                {eligible
                                  ? c.description || `Minimum order ${formatPrice(c.minOrder)}`
                                  : `Spend ${formatPrice(c.minOrder - subtotal)} more to unlock this`}
                              </p>
                            </div>
                            {eligible && (
                              <button
                                onClick={() => applyCode(c.code)}
                                disabled={couponLoading}
                                className="shrink-0 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Enter Coupon Code</p>
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
                  <span>Delivery <span className="text-gray-400">(if delivered)</span></span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{couponType === 'freeDelivery' ? 'Free Delivery' : `Discount (${couponCode})`}</span>
                    <span>-{formatPrice(effectiveDiscount)}</span>
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
