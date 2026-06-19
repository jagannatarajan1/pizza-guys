'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Check, MapPin, User, Clock, CreditCard, ShoppingBag, ArrowLeft, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { useAuth } from '@/lib/auth-context'
import { getStripe } from '@/lib/stripe-client'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const stripePromise = getStripe()

const STEPS = [
  { id: 1, label: 'Order Type', icon: ShoppingBag },
  { id: 2, label: 'Address', icon: MapPin },
  { id: 3, label: 'Details', icon: User },
  { id: 4, label: 'Timing', icon: Clock },
  { id: 5, label: 'Payment', icon: CreditCard },
]

// ─── Inner payment form (must be inside <Elements>) ────────────────────────
type PaymentFormProps = {
  total: number
  orderPayload: Record<string, unknown>
  onSuccess: (orderNumber: string) => void
}

function PaymentForm({ total, orderPayload, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [placing, setPlacing] = useState(false)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setPlacing(true)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      toast.error(submitError.message ?? 'Payment error')
      setPlacing(false)
      return
    }

    const intentRes = await fetch('/api/checkout/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.round(total * 100) }),
    })

    if (!intentRes.ok) {
      toast.error('Could not initialise payment')
      setPlacing(false)
      return
    }

    const { clientSecret } = await intentRes.json()

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/order-tracking`,
      },
    })

    if (error) {
      toast.error(error.message ?? 'Payment failed')
      setPlacing(false)
      return
    }

    const orderRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderPayload, paymentIntentId: paymentIntent?.id, paymentMethod: 'card' }),
    })

    if (!orderRes.ok) {
      toast.error('Payment succeeded but order save failed — contact us')
      setPlacing(false)
      return
    }

    const { orderNumber } = await orderRes.json()
    onSuccess(orderNumber)
  }

  return (
    <div>
      <PaymentElement />
      <button
        onClick={handlePay}
        disabled={placing || !stripe || !elements}
        className={`w-full mt-5 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${placing ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
      >
        {placing ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
        ) : (
          <>Pay {formatPrice(total)}</>
        )}
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">🔒 Secured by Stripe</p>
    </div>
  )
}

// ─── Cash order form (no Stripe needed) ────────────────────────────────────
type CashFormProps = {
  total: number
  orderPayload: Record<string, unknown>
  onSuccess: (orderNumber: string) => void
}

function CashForm({ total, orderPayload, onSuccess }: CashFormProps) {
  const [placing, setPlacing] = useState(false)

  const handlePlace = async () => {
    setPlacing(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderPayload, paymentMethod: 'cash' }),
    })
    if (!res.ok) {
      toast.error('Could not place order — please try again')
      setPlacing(false)
      return
    }
    const { orderNumber } = await res.json()
    onSuccess(orderNumber)
  }

  return (
    <div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800">
        You will pay <strong>{formatPrice(total)}</strong> in cash when your order arrives.
      </div>
      <button
        onClick={handlePlace}
        disabled={placing}
        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${placing ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
      >
        {placing ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Placing...</>
        ) : (
          <>Place Order · {formatPrice(total)}</>
        )}
      </button>
    </div>
  )
}

// ─── Main checkout page ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, couponDiscount, deliveryFee, getSubtotal, clearCart } = useCartStore()

  const [step, setStep] = useState(1)
  const [orderType, setOrderType] = useState<'delivery' | 'collection'>('delivery')
  const [selectedAddressId, setSelectedAddressId] = useState(user?.addresses.find((a) => a.isDefault)?.id || '')
  const [newAddress, setNewAddress] = useState({ postcode: '', line1: '', line2: '', city: '', notes: '' })
  const [useNewAddress, setUseNewAddress] = useState(!user?.addresses.length)
  const [customerDetails, setCustomerDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  })
  const [timing, setTiming] = useState<'asap' | 'scheduled'>('asap')
  const [scheduledTime, setScheduledTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')

  const subtotal = getSubtotal()
  const total = Math.max(0, subtotal - couponDiscount + (orderType === 'delivery' ? deliveryFee : 0))

  const handleSuccess = (orderNumber: string) => {
    clearCart()
    router.push(`/order-tracking?order=${orderNumber}`)
  }

  const resolvedAddress = useNewAddress
    ? newAddress
    : user?.addresses.find((a) => a.id === selectedAddressId) ?? null

  const orderPayload = {
    userId: user?.id ?? null,
    orderType,
    customerName: customerDetails.name,
    customerEmail: customerDetails.email,
    customerPhone: customerDetails.phone,
    deliveryAddress: orderType === 'delivery' ? resolvedAddress : null,
    items,
    subtotal: subtotal * 100,
    deliveryFee: orderType === 'delivery' ? deliveryFee * 100 : 0,
    discount: couponDiscount * 100,
    total: total * 100,
    scheduledTime: timing === 'scheduled' ? scheduledTime : null,
  }

  // Stripe Elements appearance
  const elementsOptions = {
    mode: 'payment' as const,
    amount: Math.round(total * 100),
    currency: 'gbp',
    appearance: {
      theme: 'stripe' as const,
      variables: { colorPrimary: '#dc2626' },
    },
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your basket is empty</h2>
        <Link href="/menu" className="mt-4 bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors">
          Back to Menu
        </Link>
      </div>
    )
  }

  const nextStep = () => setStep((s) => Math.min(5, s + 1))
  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Back to Basket
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
                  onClick={() => setOrderType(opt.value)}
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
                <h3 className="font-bold text-gray-900 mb-1">Pizza Guys</h3>
                <p className="text-gray-600 text-sm">209 Laleham Road, Staines-upon-Thames, Surrey, TW18 2EA</p>
                <p className="text-sm text-green-600 mt-2 font-medium">✅ Ready for collection in 15-20 min</p>
              </div>
            ) : (
              <div>
                {user?.addresses && user.addresses.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {user.addresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => { setSelectedAddressId(addr.id); setUseNewAddress(false) }}
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
                          onChange={(e) => setNewAddress((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))}
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

            {/* Payment method selector */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {([
                { value: 'card', label: '💳 Pay by Card', desc: 'Credit / Debit / Apple Pay / Google Pay' },
                { value: 'cash', label: '💵 Pay with Cash', desc: 'Pay on delivery' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${paymentMethod === opt.value ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="font-bold text-gray-900 text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </button>
              ))}
            </div>

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
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1">
                  <span>Total</span><span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Stripe Elements (card) or cash confirmation */}
            {paymentMethod === 'card' ? (
              <Elements stripe={stripePromise} options={elementsOptions}>
                <PaymentForm
                  total={total}
                  orderPayload={orderPayload}
                  onSuccess={handleSuccess}
                />
              </Elements>
            ) : (
              <CashForm
                total={total}
                orderPayload={orderPayload}
                onSuccess={handleSuccess}
              />
            )}
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
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center justify-center gap-2"
          >
            Continue <ChevronRight size={16} />
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
