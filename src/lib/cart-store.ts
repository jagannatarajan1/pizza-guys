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

type CouponType = 'percentage' | 'fixed' | 'freeDelivery' | ''

type CartStore = {
  items: CartItem[]
  couponCode: string
  couponDiscount: number
  couponType: CouponType
  couponMinOrder: number
  deliveryFee: number
  addItem: (item: Omit<CartItem, 'cartId'>) => void
  removeItem: (cartId: string) => void
  updateQuantity: (cartId: string, quantity: number) => void
  updateItem: (cartId: string, item: Partial<CartItem>) => void
  incrementSimpleProduct: (product: Product) => void
  decrementSimpleProduct: (product: Product) => void
  clearCart: () => void
  applyCoupon: (code: string, discount: number, type: CouponType, minOrder: number) => void
  removeCoupon: () => void
  setDeliveryFee: (fee: number) => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
  getProductQuantity: (productId: string) => number
  getEffectiveDiscount: () => number
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
      couponCode: '',
      couponDiscount: 0,
      couponType: '' as CouponType,
      couponMinOrder: 0,
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

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0, couponType: '', couponMinOrder: 0 }),

      applyCoupon: (code, discount, type, minOrder) =>
        set({ couponCode: code, couponDiscount: discount, couponType: type, couponMinOrder: minOrder }),

      removeCoupon: () => set({ couponCode: '', couponDiscount: 0, couponType: '', couponMinOrder: 0 }),

      setDeliveryFee: (fee) => set({ deliveryFee: fee }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.itemTotal, 0)
      },

      // A freeDelivery coupon's real-money value is whatever the delivery fee
      // actually is right now (it can change once a postcode/zone is picked
      // at checkout), so it's computed live rather than stored as a fixed amount.
      getEffectiveDiscount: () => {
        const { couponType, couponDiscount, deliveryFee } = get()
        return couponType === 'freeDelivery' ? deliveryFee : couponDiscount
      },

      getTotal: () => {
        const { deliveryFee } = get()
        const subtotal = get().getSubtotal()
        return Math.max(0, subtotal - get().getEffectiveDiscount() + deliveryFee)
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
