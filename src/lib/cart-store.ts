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

type CartStore = {
  items: CartItem[]
  couponCode: string
  couponDiscount: number
  deliveryFee: number
  addItem: (item: Omit<CartItem, 'cartId'>) => void
  removeItem: (cartId: string) => void
  updateQuantity: (cartId: string, quantity: number) => void
  updateItem: (cartId: string, item: Partial<CartItem>) => void
  clearCart: () => void
  applyCoupon: (code: string, discount: number) => void
  removeCoupon: () => void
  setDeliveryFee: (fee: number) => void
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
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

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),

      removeCoupon: () => set({ couponCode: '', couponDiscount: 0 }),

      setDeliveryFee: (fee) => set({ deliveryFee: fee }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.itemTotal, 0)
      },

      getTotal: () => {
        const { couponDiscount, deliveryFee } = get()
        const subtotal = get().getSubtotal()
        return Math.max(0, subtotal - couponDiscount + deliveryFee)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    { name: 'pizza-guys-cart' }
  )
)
