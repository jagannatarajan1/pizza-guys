'use client'
import { useState } from 'react'
import Link from 'next/link'
import { User, MapPin, Package, CreditCard, Lock, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'password', label: 'Password', icon: Lock },
]

const MOCK_ORDERS = [
  { id: 'PG100001', date: '2025-06-15', items: ['Pepperoni Feast (12")', 'French Fries', 'Coke'], total: 18.97, status: 'Delivered' },
  { id: 'PG100002', date: '2025-06-08', items: ['Meat Feast (15")', 'BBQ Wings', 'Garlic Bread'], total: 24.47, status: 'Delivered' },
  { id: 'PG100003', date: '2025-05-30', items: ['Chicken Tikka (12")', 'Diet Coke'], total: 13.48, status: 'Delivered' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { user, updateProfile, addAddress, updateAddress, deleteAddress, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' })
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newAddr, setNewAddr] = useState({ label: 'Home', line1: '', line2: '', city: '', postcode: '', notes: '', isDefault: false })
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })

  if (!user) {
    router.push('/login')
    return null
  }

  const saveProfile = () => {
    updateProfile(profileForm)
    setEditingProfile(false)
    toast.success('Profile updated!')
  }

  const saveAddress = () => {
    if (!newAddr.postcode || !newAddr.line1 || !newAddr.city) { toast.error('Please fill required fields'); return }
    addAddress(newAddr)
    setShowAddAddress(false)
    setNewAddr({ label: 'Home', line1: '', line2: '', city: '', postcode: '', notes: '', isDefault: false })
    toast.success('Address saved!')
  }

  const changePassword = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { toast.error('Fill all fields'); return }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('Passwords do not match'); return }
    if (pwForm.newPw.length < 6) { toast.error('Password must be 6+ characters'); return }
    setPwForm({ current: '', newPw: '', confirm: '' })
    toast.success('Password updated!')
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
                <button onClick={() => setEditingProfile((v) => !v)} className="flex items-center gap-1.5 text-sm text-red-600 font-semibold hover:underline">
                  <Pencil size={13} /> {editingProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editingProfile ? (
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
                    </div>
                  ))}
                  <button onClick={saveProfile} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
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
                <button onClick={() => setShowAddAddress((v) => !v)} className="flex items-center gap-1.5 text-sm text-red-600 font-semibold hover:underline">
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
                        <button onClick={() => { deleteAddress(addr.id); toast.success('Address removed') }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="font-bold text-gray-900 mb-5">Order History</h2>
              <div className="space-y-3">
                {MOCK_ORDERS.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">#{order.id}</div>
                        <div className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{order.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">{order.items.join(' · ')}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">£{order.total.toFixed(2)}</span>
                      <Link href={`/order-tracking?order=${order.id}`} className="text-red-600 text-sm font-semibold hover:underline">
                        Reorder
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
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
                  { key: 'newPw', label: 'New Password', placeholder: 'Min 6 characters' },
                  { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{f.label}</label>
                    <input
                      type="password"
                      value={pwForm[f.key as keyof typeof pwForm]}
                      onChange={(e) => setPwForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                    />
                  </div>
                ))}
                <button onClick={changePassword} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
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
