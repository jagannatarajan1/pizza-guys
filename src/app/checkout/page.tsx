'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, MapPin, User, Clock, CreditCard, ShoppingBag, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth-context'
import { formatPrice, isValidPostcode } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSiteConfig } from '@/context/SiteConfigContext'
import { useOrderType } from '@/context/OrderTypeContext'

const STEPS = [
  { id: 1, label: 'Order Type', icon: ShoppingBag },
  { id: 2, label: 'Address', icon: MapPin },
  { id: 3, label: 'Details', icon: User },
  { id: 4, label: 'Timing', icon: Clock },
  { id: 5, label: 'Payment', icon: CreditCard },
]

// ─── Stripe Checkout redirect ───────────────────────────────────────────────
type PaymentFormProps = {
  total: number
  orderPayload: Record<string, unknown>
}

function PaymentForm({ total, orderPayload }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error ?? 'Could not start checkout')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Could not start checkout — please try again')
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4 text-sm text-blue-800">
        You will be redirected to Stripe&apos;s secure payment page to complete your order.
      </div>
      <button
        onClick={handlePay}
        disabled={loading}
        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${loading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Redirecting to Stripe...</>
        ) : (
          <>Pay {formatPrice(total)} · Secure Checkout</>
        )}
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">🔒 Secured by Stripe</p>
    </div>
  )
}

// ─── Main checkout page ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  const cfg = useSiteConfig()
  const { user, isLoading: authLoading } = useAuth()
  const { items, appliedCoupons, deliveryFee, getSubtotal, setDeliveryFee, getEffectiveDiscount, clearCoupons } = useCartStore()
  const { orderType: homeOrderType, setOrderType: setHomeOrderType } = useOrderType()

  const [step, setStep] = useState(1)
  // Pre-select whatever the customer already chose on the homepage — falls
  // back to 'delivery' the first time they land straight on checkout.
  const [orderType, setOrderType] = useState<'delivery' | 'collection'>(homeOrderType ?? 'delivery')

  // The shared order-type context loads its saved value from localStorage a
  // moment AFTER mount (it starts out null on every fresh page load), so the
  // useState initializer above often runs too early and misses it. Adjusting
  // state during render (React's documented pattern for this) rather than in
  // an effect — this also re-fires harmlessly when the user picks an option
  // here, since that updates the shared context to the same value.
  const [prevHomeOrderType, setPrevHomeOrderType] = useState(homeOrderType)
  if (homeOrderType !== prevHomeOrderType) {
    setPrevHomeOrderType(homeOrderType)
    if (homeOrderType) setOrderType(homeOrderType)
  }
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses.find((a) => a.isDefault)?.id || '')
  const [newAddress, setNewAddress] = useState({ postcode: '', line1: '', line2: '', city: '', notes: '' })
  const [useNewAddress, setUseNewAddress] = useState(!user?.addresses.length)
  const [customerDetails, setCustomerDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  })

  // Like homeOrderType above: the account (with its saved addresses/name/
  // phone/email) loads a moment after mount, so the useState initializers
  // above almost always miss it — defaulting to the blank "add new address"
  // form even for a customer with a saved default address, and leaving Your
  // Details blank even though we already know who they are. Sync once the
  // real data lands, same "adjust state during render" pattern as the
  // order-type fix.
  const [prevUser, setPrevUser] = useState(user)
  if (user !== prevUser) {
    setPrevUser(user)
    if (user?.addresses?.length) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0]
      setSelectedAddressId(defaultAddr.id)
      setUseNewAddress(false)
    }
    if (user) {
      setCustomerDetails({ name: user.name || '', phone: user.phone || '', email: user.email || '' })
    }
  }
  const [timing, setTiming] = useState<'asap' | 'scheduled'>('asap')
  const [scheduledTime, setScheduledTime] = useState('')
  const [zoneError, setZoneError] = useState('')
  const [advancingStep, setAdvancingStep] = useState(false)

  const subtotal = getSubtotal()
  const effectiveDiscount = getEffectiveDiscount(orderType)
  const total = Math.max(0, subtotal - effectiveDiscount + (orderType === 'delivery' ? deliveryFee : 0))

  // A coupon the customer picked in the cart may not survive switching order
  // type here (an admin can mark one delivery-only, and a free-delivery
  // coupon is worthless on collection). Re-check with the server whenever
  // the order type changes so an ineligible coupon is dropped up front with
  // a clear reason, instead of the order being rejected at the Pay step.
  const appliedCodes = appliedCoupons.map((c) => c.code).join(',')
  useEffect(() => {
    if (!appliedCodes) return
    let cancelled = false
    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codes: appliedCodes.split(','),
        items: items.map((i) => ({ category: i.product.category, itemTotal: i.itemTotal })),
        deliveryFee,
        orderType,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled || ok) return
        clearCoupons()
        toast.error(d.error ?? 'Your coupon isn’t valid for this order type and has been removed')
      })
      .catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderType, appliedCodes])

  const resolvedAddress = useNewAddress
    ? newAddress
    : user?.addresses.find((a) => a.id === selectedAddressId) ?? null

  const lookupDeliveryFee = async (postcode: string) => {
    const res  = await fetch('/api/delivery/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcode, subtotal }),
    })
    return res.json()
  }

  const nextStep = async () => {
    if (step === 2 && orderType === 'delivery') {
      const addr = resolvedAddress
      if (!addr?.postcode || !addr?.line1 || !addr?.city) {
        toast.error('Please complete your delivery address')
        return
      }
      if (!isValidPostcode(addr.postcode)) {
        toast.error('Enter a valid UK postcode (e.g. SW1A 1AA)')
        return
      }
      setAdvancingStep(true)
      setZoneError('')
      try {
        const result = await lookupDeliveryFee(addr.postcode)
        if (!result.available) { setZoneError(result.message ?? "Sorry, we don't deliver to that address yet."); return }
        if (subtotal < result.minOrder) { setZoneError(`Minimum order for your area is ${formatPrice(result.minOrder)}`); return }
        setDeliveryFee(result.deliveryFee)
        if (result.freeDeliveryApplied) toast.success('🎉 Free delivery applied to your order!')
      } catch {
        // Without this the rejection escapes the click handler and the customer
        // is left on the same step with no explanation at all.
        setZoneError("We couldn't check your postcode just now — please try again in a moment")
        return
      } finally { setAdvancingStep(false) }
    }
    setStep((s) => Math.min(5, s + 1))
  }

  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  const orderPayload = {
    orderType,
    customerName: customerDetails.name,
    customerEmail: customerDetails.email,
    customerPhone: customerDetails.phone,
    deliveryAddress: orderType === 'delivery' ? resolvedAddress : null,
    items,
    couponCodes: appliedCoupons.map((c) => c.code),
    scheduledTime: timing === 'scheduled' ? scheduledTime : null,
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <Link href="/menu" className="mt-4 bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors">
          Back to Menu
        </Link>
      </div>
    )
  }

  // Ordering requires an account — gate the whole checkout wizard (not just
  // the final Pay button) so a guest is prompted up front instead of filling
  // in every step only to be rejected by the server at payment time.
  if (!authLoading && !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <User size={26} className="text-white" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Sign in to place your order</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm">
          Create a free account or sign in to track your order, save addresses and check out faster next time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/login?redirect=/checkout" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    )
  }


  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Back to Cart
        </Link>
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto hide-scrollbar pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > s.id ? <Check size={16} /> : s.id}
              </div>
              <span className={`text-xs mt-1 font-medium whitespace-nowrap ${step >= s.id ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-12 mx-1 mt-[-1rem] ${step > s.id + 1 ? 'bg-green-400' : step > s.id ? 'bg-red-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        {/* Step 1: Order Type */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">How would you like your order?</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'delivery', label: 'Delivery', desc: 'To your door', icon: '🚚' },
                { value: 'collection', label: 'Collection', desc: 'Pick up in-store', icon: '🏪' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setOrderType(opt.value); setHomeOrderType(opt.value) }}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${orderType === opt.value ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="text-3xl mb-2">{opt.icon}</div>
                  <div className="font-bold text-gray-900">{opt.label}</div>
                  <div className="text-sm text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {orderType === 'delivery' ? 'Delivery Address' : 'Your Location'}
            </h2>
            {orderType === 'collection' ? (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-1">{cfg.biz_name}</h3>
                <p className="text-gray-600 text-sm">{cfg.biz_address}</p>
                <p className="text-sm text-green-600 mt-2 font-medium">✅ Ready for collection in 15-20 min</p>
              </div>
            ) : (
              <div>
                {user?.addresses && user.addresses.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {user.addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => { setSelectedAddressId(addr.id); setUseNewAddress(false); setZoneError('') }}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${!useNewAddress && selectedAddressId === addr.id ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <div className="font-bold text-gray-900 text-sm">{addr.label || 'Home'}</div>
                        <div className="text-gray-500 text-sm">{addr.line1}, {addr.city}, {addr.postcode}</div>
                      </button>
                    ))}
                    <button
                      onClick={() => setUseNewAddress(true)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${useNewAddress ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="font-bold text-gray-900 text-sm">+ Add new address</div>
                    </button>
                  </div>
                )}
                {(useNewAddress || !user?.addresses?.length) && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode *</label>
                        <input
                          value={newAddress.postcode}
                          onChange={(e) => { setNewAddress((p) => ({ ...p, postcode: e.target.value.toUpperCase() })); setZoneError('') }}
                          placeholder="TW18 1AB"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">City *</label>
                        <input
                          value={newAddress.city}
                          onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                          placeholder="Staines"
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 1 *</label>
                      <input
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress((p) => ({ ...p, line1: e.target.value }))}
                        placeholder="House number and street"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line 2</label>
                      <input
                        value={newAddress.line2}
                        onChange={(e) => setNewAddress((p) => ({ ...p, line2: e.target.value }))}
                        placeholder="Flat, apartment etc. (optional)"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery Notes</label>
                      <input
                        value={newAddress.notes}
                        onChange={(e) => setNewAddress((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="Any special delivery instructions..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                      />
                    </div>
                  </div>
                )}
                {zoneError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
                    {zoneError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Customer details */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Your Details</h2>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Full Name *', placeholder: 'John Smith', type: 'text' },
                { key: 'phone', label: 'Mobile Number *', placeholder: '07700900000', type: 'tel' },
                { key: 'email', label: 'Email Address *', placeholder: 'john@example.com', type: 'email' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={customerDetails[field.key as keyof typeof customerDetails]}
                    onChange={(e) => setCustomerDetails((p) => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                    autoComplete={field.key === 'name' ? 'name' : field.key === 'phone' ? 'tel' : 'email'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Timing */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">When would you like your order?</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {([
                { value: 'asap', label: 'ASAP', desc: 'Est. 30-45 min', icon: '⚡' },
                { value: 'scheduled', label: 'Schedule', desc: 'Choose a time', icon: '📅' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTiming(opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${timing === opt.value ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-2">{opt.icon}</div>
                  <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>
            {timing === 'scheduled' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Time</label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Payment */}
        {step === 5 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment</h2>

            {/* Order summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
              <div className="space-y-1 text-sm mb-3 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.cartId} className="flex justify-between text-gray-600">
                    <span>{item.quantity}× {item.product.name}</span>
                    <span>{formatPrice(item.itemTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span><span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupons.map((c) => c.code).join(', ')})</span><span>-{formatPrice(effectiveDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <PaymentForm
              total={total}
              orderPayload={orderPayload}
            />
          </div>
        )}
      </div>

      {/* Navigation (steps 1-4 only) */}
      {step < 5 && (
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={advancingStep}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            {advancingStep ? <Loader2 size={16} className="animate-spin" /> : <>Continue <ChevronRight size={16} /></>}
          </button>
        </div>
      )}
      {step === 5 && (
        <button
          onClick={prevStep}
          className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:border-gray-300 transition-colors"
        >
          Back
        </button>
      )}
    </div>
  )
}
