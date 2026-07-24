import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, ModifierOption, ModifierGroup } from './types'

export type CartItemModifier = {
  groupId: string
  groupName: string
  options: ModifierOption[]
}

export type CartItem = {
  cartId: string
  product: Product
  quantity: number
  modifiers: CartItemModifier[]
  specialInstructions: string
  itemTotal: number
}

export type CouponType = 'percentage' | 'fixed' | 'freeDelivery' | ''
export type OrderTypeForPricing = 'delivery' | 'collection'

export type AppliedCoupon = { code: string; type: CouponType; value: number; minOrder: number; applicableCategories: string[] }

type CartStore = {
  items: CartItem[]
  appliedCoupons: AppliedCoupon[]
  deliveryFee: number
  addItem: (item: Omit<CartItem, 'cartId'>) => void
  removeItem: (cartId: string) => void
  updateQuantity: (cartId: string, quantity: number) => void
  updateItem: (cartId: string, item: Partial<CartItem>) => void
  incrementSimpleProduct: (product: Product) => void
  decrementSimpleProduct: (product: Product) => void
  clearCart: () => void
  addCoupon: (coupon: AppliedCoupon) => void
  removeCoupon: (code: string) => void
  clearCoupons: () => void
  setDeliveryFee: (fee: number) => void
  getSubtotal: () => number
  getItemCount: () => number
  getProductQuantity: (productId: string) => number
  // A freeDelivery coupon's real-money value is whatever the delivery fee
  // actually is right now (it can change once a postcode/zone is picked at
  // checkout) and only applies at all for delivery orders — so it's computed
  // live from the caller's current order type rather than stored as a fixed
  // amount.
  getEffectiveDiscount: (orderType: OrderTypeForPricing) => number
}

function computeItemTotal(product: Product, modifiers: CartItemModifier[], quantity: number): number {
  const modifierTotal = modifiers.reduce((sum, group) => {
    return sum + group.options.reduce((s, o) => s + o.price, 0)
  }, 0)
  return (product.price + modifierTotal) * quantity
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupons: [],
      deliveryFee: 1.99,

      addItem: (item) => {
        const cartId = `${item.product.id}-${Date.now()}`
        set((state) => ({
          items: [...state.items, { ...item, cartId }],
        }))
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartId !== cartId),
        }))
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartId === cartId
              ? { ...i, quantity, itemTotal: computeItemTotal(i.product, i.modifiers, quantity) }
              : i
          ),
        }))
      },

      // Quick-add path for products with no modifiers to choose — taps on the
      // menu card increment one shared cart line instead of creating a new
      // line per tap (the modal-driven add always creates a new line, since
      // different taps can carry different modifier choices).
      incrementSimpleProduct: (product) => {
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.modifiers.length === 0 && !i.specialInstructions
        )
        if (existing) {
          get().updateQuantity(existing.cartId, existing.quantity + 1)
        } else {
          get().addItem({ product, quantity: 1, modifiers: [], specialInstructions: '', itemTotal: product.price })
        }
      },

      // Mirror of incrementSimpleProduct for the card's minus button — only
      // meaningful for no-modifier lines, since a product bought with different
      // modifier choices can have several cart lines and there'd be no single
      // correct one to decrement from the card.
      decrementSimpleProduct: (product) => {
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.modifiers.length === 0 && !i.specialInstructions
        )
        if (existing) {
          get().updateQuantity(existing.cartId, existing.quantity - 1)
        }
      },

      updateItem: (cartId, updates) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.cartId !== cartId) return i
            const merged = { ...i, ...updates }
            return {
              ...merged,
              itemTotal: computeItemTotal(merged.product, merged.modifiers, merged.quantity),
            }
          }),
        }))
      },

      clearCart: () => set({ items: [], appliedCoupons: [] }),

      addCoupon: (coupon) =>
        set((state) => ({
          appliedCoupons: [...state.appliedCoupons.filter((c) => c.code !== coupon.code), coupon],
        })),

      removeCoupon: (code) =>
        set((state) => ({ appliedCoupons: state.appliedCoupons.filter((c) => c.code !== code) })),

      clearCoupons: () => set({ appliedCoupons: [] }),

      setDeliveryFee: (fee) => set({ deliveryFee: fee }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.itemTotal, 0)
      },

      getEffectiveDiscount: (orderType) => {
        const { appliedCoupons, deliveryFee, items } = get()
        const subtotal = get().getSubtotal()
        const raw = appliedCoupons.reduce((sum, c) => {
          // Category-restricted coupons only discount the matching items'
          // spend, not the whole cart — mirrors the server's qualifying-
          // subtotal logic in src/lib/coupons.ts so the two never disagree.
          const qualifying = c.applicableCategories.length === 0
            ? subtotal
            : items.filter((i) => c.applicableCategories.includes(i.product.category)).reduce((s, i) => s + i.itemTotal, 0)
          if (c.type === 'percentage') return sum + Math.round(qualifying * c.value) / 100
          if (c.type === 'fixed') return sum + Math.min(c.value, qualifying)
          if (c.type === 'freeDelivery') return sum + (orderType === 'delivery' ? deliveryFee : 0)
          return sum
        }, 0)
        const cap = subtotal + (orderType === 'delivery' ? deliveryFee : 0)
        return Math.min(raw, cap)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getProductQuantity: (productId) => {
        return get().items
          .filter((i) => i.product.id === productId)
          .reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    { name: 'pizza-guys-cart' }
  )
)
