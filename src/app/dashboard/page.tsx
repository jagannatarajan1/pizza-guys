'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { User, MapPin, Package, CreditCard, Lock, Pencil, Trash2, Plus, Check, X, Loader2, ChevronDown, Printer, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatPrice, isValidPostcode } from '@/lib/utils'
import { useSiteConfig } from '@/context/SiteConfigContext'
import { useCartStore } from '@/lib/cart-store'
import { reorderItems } from '@/lib/reorder'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'password', label: 'Password', icon: Lock },
]

const STATUS_PILL: Record<string, string> = {
  pending_payment:    'bg-amber-100 text-amber-700',
  confirmed:          'bg-blue-100 text-blue-700',
  New:                'bg-blue-100 text-blue-700',
  Accepted:           'bg-yellow-100 text-yellow-700',
  Preparing:          'bg-orange-100 text-orange-700',
  Ready:              'bg-cyan-100 text-cyan-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Completed:          'bg-green-100 text-green-700',
  Cancelled:          'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Payment Pending',
  confirmed:       'Order Received',
}

type OrderItemModifier = { groupId: string; groupName: string; options: { id: string; name: string; price: number }[] }

type CustomerOrderItem = {
  productId: string; name: string; quantity: number; unitPrice: number; itemTotal: number
  modifiers: OrderItemModifier[]; specialInstructions: string; image: string
}

type CustomerOrder = {
  orderNumber: string
  status: string
  orderType: string
  customerName: string
  customerPhone: string
  deliveryAddress: { label?: string; line1: string; line2: string; city: string; postcode: string } | null
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  paymentMethod: string
  scheduledTime: string | null
  createdAt: string
  items: CustomerOrderItem[]
}

function DashboardContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const cfg = useSiteConfig()
  const addItem = useCartStore((s) => s.addItem)
  const { user, isLoading: authLoading, updateProfile, addAddress, updateAddress, deleteAddress, logout, setUser } = useAuth()
  const validTabs = ['profile', 'addresses', 'orders', 'payment', 'password']
  const tabParam  = searchParams.get('tab') ?? ''
  const [activeTab, setActiveTab] = useState(validTabs.includes(tabParam) ? tabParam : 'profile')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email verified! Welcome to Pizza Guys.')
    }
  }, [searchParams])
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm]       = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddr, setNewAddr]               = useState({ label: 'Home', line1: '', line2: '', city: '', postcode: '', notes: '', isDefault: false })
  const [editingAddrId, setEditingAddrId]   = useState<string | null>(null)
  const [editAddr, setEditAddr]             = useState({ label: '', line1: '', line2: '', city: '', postcode: '', notes: '', isDefault: false })
  const [orders, setOrders]                 = useState<CustomerOrder[]>([])
  const [ordersLoading, setOrdersLoading]   = useState(false)

  useEffect(() => {
    if (activeTab !== 'orders') return
    setOrdersLoading(true)
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false))
  }, [activeTab])
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [changeEmailPassword, setChangeEmailPassword] = useState('')
  const [emailStep, setEmailStep] = useState<'idle' | 'otp'>('idle')
  const [otpCode, setOtpCode] = useState('')
  const [otpSubmitting, setOtpSubmitting] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendSubmitting, setResendSubmitting] = useState(false)

  const pwChecks = [
    { label: 'At least 8 characters', met: pwForm.newPw.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(pwForm.newPw) },
    { label: 'One lowercase letter', met: /[a-z]/.test(pwForm.newPw) },
    { label: 'One number', met: /[0-9]/.test(pwForm.newPw) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(pwForm.newPw) },
  ]

  // Redirect must happen in an effect, never during render — calling
  // router.push() directly in the render body also runs during the server's
  // render pass (this is a client component, but still server-rendered for
  // the initial HTML), and Next's router touches browser-only APIs there,
  // crashing the server with "location is not defined". Also wait for the
  // auth check to finish before deciding — `user` is briefly null on every
  // fresh load while /api/auth/me is still in flight, so redirecting on that
  // alone would bounce a logged-in visitor straight back to /login.
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  if (authLoading || !user) {
    return null
  }

  const saveProfile = async () => {
    const emailChanged = profileForm.email.trim().toLowerCase() !== user.email.toLowerCase()

    // Name/phone take effect immediately — email requires confirming the new
    // address first, so the account's real email is never touched here.
    await updateProfile({ name: profileForm.name, phone: profileForm.phone })

    if (emailChanged) {
      if (!changeEmailPassword) {
        toast.error('Enter your current password to change your email')
        return
      }
      setEmailSaving(true)
      try {
        const res  = await fetch('/api/auth/change-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail: profileForm.email.trim(), currentPassword: changeEmailPassword }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? 'Could not start email change')
          setProfileForm((p) => ({ ...p, email: user.email })) // revert the unconfirmed value shown in the form
        } else {
          toast.success(`We sent a code to ${profileForm.email} — enter it below to confirm`)
          setEmailStep('otp')
          setChangeEmailPassword('')
          return
        }
      } catch {
        toast.error('Could not start email change')
        setProfileForm((p) => ({ ...p, email: user.email }))
      } finally {
        setEmailSaving(false)
      }
    } else {
      toast.success('Profile updated!')
    }

    setEditingProfile(false)
  }

  const verifyEmailOtp = async () => {
    if (otpCode.length !== 6) { setOtpError('Enter the 6-digit code'); return }
    setOtpSubmitting(true)
    setOtpError('')
    try {
      const res  = await fetch('/api/auth/verify-email-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) { setOtpError(data.error ?? 'Incorrect code'); return }
      setUser({ ...user, email: data.email })
      toast.success('Email updated!')
      setEmailStep('idle')
      setOtpCode('')
      setEditingProfile(false)
    } catch {
      setOtpError('Network error — please try again')
    } finally {
      setOtpSubmitting(false)
    }
  }

  const resendEmailOtp = async () => {
    setResendSubmitting(true)
    setOtpError('')
    try {
      const res  = await fetch('/api/auth/resend-email-change-otp', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Could not resend code'); return }
      toast.success('New code sent!')
    } catch {
      toast.error('Could not resend code')
    } finally {
      setResendSubmitting(false)
    }
  }

  const cancelEmailChange = () => {
    setEmailStep('idle')
    setOtpCode('')
    setOtpError('')
    setProfileForm((p) => ({ ...p, email: user.email }))
    setEditingProfile(false)
  }

  const saveAddress = () => {
    if (!newAddr.postcode || !newAddr.line1 || !newAddr.city) { toast.error('Please fill required fields'); return }
    if (!isValidPostcode(newAddr.postcode)) { toast.error('Enter a valid UK postcode (e.g. SW1A 1AA)'); return }
    addAddress(newAddr)
    setShowAddAddress(false)
    setNewAddr({ label: 'Home', line1: '', line2: '', city: '', postcode: '', notes: '', isDefault: false })
    toast.success('Address saved!')
  }

  const startEditAddress = (addr: typeof user.addresses[number]) => {
    setShowAddAddress(false)
    setEditingAddrId(addr.id)
    setEditAddr({
      label: addr.label, line1: addr.line1, line2: addr.line2,
      city: addr.city, postcode: addr.postcode, notes: addr.notes, isDefault: addr.isDefault,
    })
  }

  const saveEditAddress = () => {
    if (!editingAddrId) return
    if (!editAddr.postcode || !editAddr.line1 || !editAddr.city) { toast.error('Please fill required fields'); return }
    if (!isValidPostcode(editAddr.postcode)) { toast.error('Enter a valid UK postcode (e.g. SW1A 1AA)'); return }
    updateAddress(editingAddrId, editAddr)
    setEditingAddrId(null)
    toast.success('Address updated!')
  }

  const printInvoice = (order: CustomerOrder) => {
    const bizName  = cfg.biz_name    || 'Pizza Guys'
    const bizAddr  = cfg.biz_address || ''
    const bizPhone = cfg.biz_phone   || ''
    const primary  = cfg.theme_primary || '#E53935'
    const date     = new Date(order.createdAt)
    const dateStr  = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr  = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const addr     = order.deliveryAddress

    const itemRows = order.items.map((item) => {
      const modLines = item.modifiers.map((m) =>
        `${m.groupName}: ${m.options.map((o) => o.name).join(', ')}`
      ).join('<br/>')
      return `
      <tr>
        <td style="padding:5px 0;vertical-align:top">${item.quantity}×</td>
        <td style="padding:5px 8px;vertical-align:top">
          ${item.name}
          ${modLines ? `<br/><span style="font-size:12px;color:#888">${modLines}</span>` : ''}
          ${item.specialInstructions ? `<br/><span style="font-size:12px;color:#888">Note: ${item.specialInstructions}</span>` : ''}
        </td>
        <td style="padding:5px 0;text-align:right;vertical-align:top;white-space:nowrap">${formatPrice(item.itemTotal)}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 15px; color: #111; background: #fff; width: 80mm; margin: 0 auto; padding: 16px 12px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .divider { border: none; border-top: 1px dashed #999; margin: 10px 0; }
    .divider-solid { border: none; border-top: 2px solid #111; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { font-size: 14px; }
    .total-row td { font-size: 17px; font-weight: 900; padding-top: 6px; }
    .badge { display:inline-block; background:${primary}; color:#fff; font-size:12px; font-weight:700; padding:2px 8px; border-radius:4px; letter-spacing:1px; }
    @media print { body { margin: 0; padding: 8px; } @page { margin: 0; size: 80mm auto; } }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:12px">
    <div style="font-size:23px;font-weight:900;letter-spacing:1px">${bizName.toUpperCase()}</div>
    ${bizAddr ? `<div style="font-size:13px;color:#555;margin-top:3px">${bizAddr}</div>` : ''}
    ${bizPhone ? `<div style="font-size:13px;color:#555">Tel: ${bizPhone}</div>` : ''}
  </div>
  <hr class="divider-solid">
  <div style="margin-bottom:8px">
    <div class="center"><span class="badge">${order.orderType === 'delivery' ? '🚚 DELIVERY' : '🏪 COLLECTION'}</span></div>
    <table style="margin-top:8px">
      <tr><td class="bold">Order #</td><td style="text-align:right">${order.orderNumber}</td></tr>
      <tr><td class="bold">Date</td><td style="text-align:right">${dateStr}</td></tr>
      <tr><td class="bold">Time</td><td style="text-align:right">${timeStr}</td></tr>
      <tr><td class="bold">Customer</td><td style="text-align:right">${order.customerName}</td></tr>
      ${order.customerPhone ? `<tr><td class="bold">Phone</td><td style="text-align:right">${order.customerPhone}</td></tr>` : ''}
      ${addr ? `<tr><td class="bold" style="vertical-align:top">Address</td><td style="text-align:right">${[addr.line1, addr.line2, addr.city, addr.postcode].filter(Boolean).join(', ')}</td></tr>` : ''}
      ${order.scheduledTime ? `<tr><td class="bold">Scheduled</td><td style="text-align:right">${new Date(order.scheduledTime).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td></tr>` : ''}
    </table>
  </div>
  <hr class="divider">
  <table>
    <thead><tr><th style="text-align:left;padding-bottom:4px;font-size:13px;color:#555" colspan="2">ITEM</th><th style="text-align:right;padding-bottom:4px;font-size:13px;color:#555">PRICE</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <hr class="divider">
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
    ${order.deliveryFee > 0 ? `<tr><td>Delivery</td><td style="text-align:right">${formatPrice(order.deliveryFee)}</td></tr>` : ''}
    ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align:right">−${formatPrice(order.discount)}</td></tr>` : ''}
    <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatPrice(order.total)}</td></tr>
    <tr><td style="font-size:13px;color:#666">Payment</td><td style="text-align:right;font-size:13px;color:#666;text-transform:capitalize">${order.paymentMethod}</td></tr>
    <tr><td style="font-size:13px;color:#666">Status</td><td style="text-align:right;font-size:13px;color:#666">${STATUS_LABEL[order.status] ?? order.status}</td></tr>
  </table>
  <hr class="divider-solid">
  <div class="center" style="font-size:13px;color:#888;margin-top:8px">
    <div style="font-weight:700;font-size:15px;margin-bottom:4px">Thank you for your order!</div>
    <div>Please come again 🍕</div>
  </div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) { toast.error('Please allow pop-ups to view the invoice'); return }
    win.document.documentElement.innerHTML = html
    win.onload = () => { win.focus(); win.print() }
    setTimeout(() => { win.focus(); win.print() }, 500)
  }

  const reorder = (order: CustomerOrder) =>
    reorderItems(order.items, { addItem, goToCart: () => router.push('/cart') })

  const changePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { toast.error('Fill all fields'); return }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwChecks.some((c) => !c.met)) { toast.error('Your new password does not meet all requirements'); return }

    setPwSubmitting(true)
    try {
      const res  = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
          confirmPassword: pwForm.confirm,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Could not change password'); return }
      setPwForm({ current: '', newPw: '', confirm: '' })
      toast.success("Password updated! You've been signed out on all other devices.")
    } catch {
      toast.error('Could not change password')
    } finally {
      setPwSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-6">My Account</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <aside className="sm:w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-black text-lg">{user.name.charAt(0)}</span>
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</div>
              </div>
            </div>
          </div>
          <nav className="bg-white rounded-2xl border border-gray-100 p-2 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
              <X size={15} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-5">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Profile Information</h2>
                {emailStep !== 'otp' && (
                  <button onClick={() => setEditingProfile((v) => !v)} className="flex items-center gap-1.5 text-sm text-red-600 font-semibold hover:underline">
                    <Pencil size={13} /> {editingProfile ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
              {emailStep === 'otp' ? (
                <div className="max-w-sm">
                  <p className="text-sm text-gray-600 mb-4">
                    We sent a 6-digit code to <strong>{profileForm.email}</strong>. Enter it below to confirm your new email.
                  </p>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError('') }}
                    placeholder="123456"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-lg tracking-[0.4em] text-center font-bold focus:outline-none focus:border-red-400 mb-1"
                  />
                  {otpError && <p className="text-xs text-red-600 mb-3">{otpError}</p>}
                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={verifyEmailOtp}
                      disabled={otpSubmitting || otpCode.length !== 6}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {otpSubmitting && <Loader2 size={14} className="animate-spin" />}
                      Verify
                    </button>
                    <button
                      onClick={resendEmailOtp}
                      disabled={resendSubmitting}
                      className="text-sm text-red-600 font-semibold hover:underline disabled:opacity-60"
                    >
                      {resendSubmitting ? 'Sending…' : 'Resend code'}
                    </button>
                  </div>
                  <button onClick={cancelEmailChange} className="block mt-4 text-xs text-gray-400 hover:text-gray-600">
                    Cancel email change
                  </button>
                </div>
              ) : editingProfile ? (
                <div className="space-y-3">
                  {[
                    { key: 'name', label: 'Full Name', type: 'text' },
                    { key: 'email', label: 'Email Address', type: 'email' },
                    { key: 'phone', label: 'Mobile Number', type: 'tel' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        value={profileForm[f.key as keyof typeof profileForm]}
                        onChange={(e) => setProfileForm((p) => ({ ...p, [f.key]: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                      />
                      {f.key === 'email' && profileForm.email.trim().toLowerCase() !== user.email.toLowerCase() && (
                        <p className="text-xs text-amber-600 mt-1">We&apos;ll send a verification code to this address — your current email stays active until you confirm it.</p>
                      )}
                    </div>
                  ))}
                  {profileForm.email.trim().toLowerCase() !== user.email.toLowerCase() && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={changeEmailPassword}
                        onChange={(e) => setChangeEmailPassword(e.target.value)}
                        placeholder="Confirm it's you to change your email"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                      />
                    </div>
                  )}
                  <button
                    onClick={saveProfile}
                    disabled={emailSaving}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {emailSaving && <Loader2 size={14} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Full Name', value: user.name },
                    { label: 'Email Address', value: user.email },
                    { label: 'Mobile Number', value: user.phone },
                  ].map((f) => (
                    <div key={f.label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <div className="text-xs text-gray-500 mb-0.5">{f.label}</div>
                      <div className="font-semibold text-gray-900 text-sm">{f.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Addresses */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Saved Addresses</h2>
                <button onClick={() => { setShowAddAddress((v) => !v); setEditingAddrId(null) }} className="flex items-center gap-1.5 text-sm text-red-600 font-semibold hover:underline">
                  <Plus size={13} /> Add Address
                </button>
              </div>
              {showAddAddress && (
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">New Address</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                      <input value={newAddr.label} onChange={(e) => setNewAddr((p) => ({ ...p, label: e.target.value }))} placeholder="Home / Work" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode *</label>
                      <input value={newAddr.postcode} onChange={(e) => setNewAddr((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))} placeholder="TW18 1AB" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <input value={newAddr.line1} onChange={(e) => setNewAddr((p) => ({ ...p, line1: e.target.value }))} placeholder="Address Line 1 *" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                    <input value={newAddr.line2} onChange={(e) => setNewAddr((p) => ({ ...p, line2: e.target.value }))} placeholder="Address Line 2 (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                    <input value={newAddr.city} onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))} placeholder="City *" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                    <input value={newAddr.notes} onChange={(e) => setNewAddr((p) => ({ ...p, notes: e.target.value }))} placeholder="Delivery notes (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                  </div>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input type="checkbox" checked={newAddr.isDefault} onChange={(e) => setNewAddr((p) => ({ ...p, isDefault: e.target.checked }))} />
                    <span className="text-sm text-gray-600">Set as default address</span>
                  </label>
                  <div className="flex gap-2">
                    <button onClick={saveAddress} className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">Save</button>
                    <button onClick={() => setShowAddAddress(false)} className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                  </div>
                </div>
              )}
              {user.addresses.length === 0 && !showAddAddress ? (
                <div className="text-center py-10 text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No saved addresses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.addresses.map((addr) => (
                    editingAddrId === addr.id ? (
                      <div key={addr.id} className="border border-red-200 bg-red-50 rounded-xl p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-3">Edit Address</h3>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                            <input value={editAddr.label} onChange={(e) => setEditAddr((p) => ({ ...p, label: e.target.value }))} placeholder="Home / Work" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode *</label>
                            <input value={editAddr.postcode} onChange={(e) => setEditAddr((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))} placeholder="TW18 1AB" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                          </div>
                        </div>
                        <div className="space-y-2 mb-3">
                          <input value={editAddr.line1} onChange={(e) => setEditAddr((p) => ({ ...p, line1: e.target.value }))} placeholder="Address Line 1 *" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                          <input value={editAddr.line2} onChange={(e) => setEditAddr((p) => ({ ...p, line2: e.target.value }))} placeholder="Address Line 2 (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                          <input value={editAddr.city} onChange={(e) => setEditAddr((p) => ({ ...p, city: e.target.value }))} placeholder="City *" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                          <input value={editAddr.notes} onChange={(e) => setEditAddr((p) => ({ ...p, notes: e.target.value }))} placeholder="Delivery notes (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-400 bg-white" />
                        </div>
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                          <input type="checkbox" checked={editAddr.isDefault} onChange={(e) => setEditAddr((p) => ({ ...p, isDefault: e.target.checked }))} />
                          <span className="text-sm text-gray-600">Set as default address</span>
                        </label>
                        <div className="flex gap-2">
                          <button onClick={saveEditAddress} className="bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition-colors">Save</button>
                          <button onClick={() => setEditingAddrId(null)} className="bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div key={addr.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-900 text-sm">{addr.label || 'Address'}</span>
                            {addr.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Default</span>}
                          </div>
                          <div className="text-sm text-gray-600">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</div>
                          <div className="text-sm text-gray-600">{addr.city}, {addr.postcode}</div>
                          {addr.notes && <div className="text-xs text-gray-400 mt-1">📝 {addr.notes}</div>}
                        </div>
                        <div className="flex gap-1.5">
                          {!addr.isDefault && (
                            <button onClick={() => { updateAddress(addr.id, { isDefault: true }); toast.success('Default address updated') }} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" title="Set as default">
                              <Check size={15} />
                            </button>
                          )}
                          <button onClick={() => startEditAddress(addr)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Edit address">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => { deleteAddress(addr.id); toast.success('Address removed') }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete address">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="font-bold text-gray-900 mb-5">Order History</h2>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Loading…
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">You haven&apos;t placed any orders yet.</p>
                  <Link href="/menu" className="mt-4 inline-block bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">
                    Browse Menu
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.orderNumber} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">#{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_PILL[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
                        </span>
                      </div>
                      {/* Product images */}
                      <div className="flex gap-2 mb-3">
                        {order.items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="relative shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🍕</div>
                            )}
                            {item.quantity > 1 && (
                              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {item.quantity}
                              </span>
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        {order.items.slice(0, 3).map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
                        {order.items.length > 3 && ` +${order.items.length - 3} more`}
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setExpandedOrder((v) => (v === order.orderNumber ? null : order.orderNumber))}
                            className="flex items-center gap-1 text-gray-500 text-xs font-semibold hover:text-gray-700"
                          >
                            {expandedOrder === order.orderNumber ? 'Hide Details' : 'View Details'}
                            <ChevronDown size={13} className={`transition-transform ${expandedOrder === order.orderNumber ? 'rotate-180' : ''}`} />
                          </button>
                          <button
                            onClick={() => printInvoice(order)}
                            className="flex items-center gap-1 text-gray-500 text-xs font-semibold hover:text-gray-700"
                          >
                            <Printer size={13} /> Invoice
                          </button>
                          <button
                            onClick={() => reorder(order)}
                            className="flex items-center gap-1 text-blue-600 text-xs font-semibold hover:text-blue-700"
                          >
                            <RotateCcw size={13} /> Order Again
                          </button>
                          <Link
                            href={`/order-tracking?order=${order.orderNumber}`}
                            className="text-red-600 text-sm font-semibold hover:underline"
                          >
                            Track
                          </Link>
                        </div>
                      </div>

                      {expandedOrder === order.orderNumber && (
                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                          <div className="flex justify-between text-xs text-gray-500 mb-3">
                            <span className="font-semibold text-gray-700">
                              {order.orderType === 'delivery' ? '🚚 Delivery' : '🏪 Collection'}
                            </span>
                            {order.scheduledTime && (
                              <span>Scheduled: {new Date(order.scheduledTime).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                          {order.orderType === 'delivery' && order.deliveryAddress && (
                            <div className="text-xs text-gray-500 mb-3">
                              {order.deliveryAddress.line1}{order.deliveryAddress.line2 ? `, ${order.deliveryAddress.line2}` : ''}, {order.deliveryAddress.city}, {order.deliveryAddress.postcode}
                            </div>
                          )}
                          <div className="space-y-3 mb-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="border-b border-gray-50 last:border-b-0 pb-3 last:pb-0">
                                <div className="flex justify-between font-semibold text-gray-800">
                                  <span>{item.quantity}× {item.name}</span>
                                  <span>{formatPrice(item.itemTotal)}</span>
                                </div>
                                {item.modifiers.map((mod) => (
                                  <div key={mod.groupId} className="text-xs text-gray-500 mt-0.5">
                                    <span className="font-medium text-gray-600">{mod.groupName}:</span>{' '}
                                    {mod.options.map((o) => o.name).join(', ')}
                                  </div>
                                ))}
                                {item.specialInstructions && (
                                  <div className="text-xs text-gray-500 mt-0.5">📝 {item.specialInstructions}</div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600 border-t border-gray-100 pt-2">
                            <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                            {order.deliveryFee > 0 && <div className="flex justify-between"><span>Delivery Fee</span><span>{formatPrice(order.deliveryFee)}</span></div>}
                            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
                            <div className="flex justify-between font-bold text-gray-900 text-sm pt-1 border-t border-gray-100"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                            <div className="flex justify-between pt-1"><span>Payment Method</span><span className="capitalize">{order.paymentMethod}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment */}
          {activeTab === 'payment' && (
            <div>
              <h2 className="font-bold text-gray-900 mb-5">Saved Payment Methods</h2>
              <div className="border border-gray-100 rounded-xl p-4 flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-7 bg-blue-600 rounded-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">VISA</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">•••• •••• •••• 4242</div>
                    <div className="text-xs text-gray-500">Expires 12/26</div>
                  </div>
                </div>
                <button className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
              </div>
              <button className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-500 hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                <Plus size={16} /> Add Payment Method
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">🔒 Cards are securely tokenised. We never store your full card details.</p>
            </div>
          )}

          {/* Change Password */}
          {activeTab === 'password' && (
            <div>
              <h2 className="font-bold text-gray-900 mb-5">Change Password</h2>
              <div className="space-y-3 max-w-sm">
                {[
                  { key: 'current', label: 'Current Password', placeholder: '••••••••' },
                  { key: 'newPw', label: 'New Password', placeholder: 'Min 8 characters' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                    <input
                      type="password"
                      autoComplete={f.key === 'current' ? 'current-password' : 'new-password'}
                      value={pwForm[f.key as keyof typeof pwForm]}
                      onChange={(e) => setPwForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                    />
                    {f.key === 'newPw' && pwForm.newPw.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {pwChecks.map((c) => (
                          <li key={c.label} className={`text-xs flex items-center gap-1.5 ${c.met ? 'text-green-600' : 'text-gray-400'}`}>
                            <Check size={12} className={c.met ? 'opacity-100' : 'opacity-30'} />
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
                <button
                  onClick={changePassword}
                  disabled={pwSubmitting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {pwSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-400"><Loader2 size={24} className="animate-spin mr-2" /> Loading…</div>}>
      <DashboardContent />
    </Suspense>
  )
}
