import type { Product, ModifierOption } from './types'
import type { CartItemModifier } from './cart-store'
import toast from 'react-hot-toast'

export type ReorderItem = {
  productId: string
  name: string
  quantity: number
  modifiers: CartItemModifier[]
  specialInstructions: string
}

type ReorderDeps = {
  addItem: (item: { product: Product; quantity: number; modifiers: CartItemModifier[]; specialInstructions: string; itemTotal: number }) => void
  goToCart: () => void
}

// Rebuilds a cart from a past order's items using CURRENT product/modifier
// prices — never the prices stored on the old order — and drops anything
// discontinued or changed since, so a stale order can never silently produce
// a mispriced or broken cart. Shared by the dashboard order-history list and
// the order-tracking page, which both offer an "Order Again" action.
export async function reorderItems(items: ReorderItem[], { addItem, goToCart }: ReorderDeps): Promise<void> {
  try {
    const res  = await fetch('/api/menu/products')
    const data = await res.json()
    const currentProducts: Product[] = data.products ?? []
    const productMap = Object.fromEntries(currentProducts.map((p) => [p.id, p]))

    let added = 0
    const skippedItems: string[] = []
    const changedItems: string[] = []

    items.forEach((item) => {
      const product = productMap[item.productId]
      if (!product || !product.available) {
        skippedItems.push(item.name)
        return
      }

      let droppedAnyOption = false
      const modifiers: CartItemModifier[] = item.modifiers
        .map((mod) => {
          const currentGroup = product.modifiers?.find((g) => g.id === mod.groupId)
          if (!currentGroup) { droppedAnyOption = true; return null }
          const options = mod.options
            .map((o) => currentGroup.options.find((co) => co.id === o.id))
            .filter((o): o is ModifierOption => {
              if (!o) droppedAnyOption = true
              return !!o
            })
          if (options.length === 0) return null
          return { groupId: currentGroup.id, groupName: currentGroup.name, options }
        })
        .filter((m): m is CartItemModifier => !!m)

      if (droppedAnyOption) changedItems.push(item.name)

      const itemTotal = (product.price + modifiers.reduce((sum, m) => sum + m.options.reduce((s, o) => s + o.price, 0), 0)) * item.quantity

      addItem({ product, quantity: item.quantity, modifiers, specialInstructions: item.specialInstructions, itemTotal })
      added++
    })

    if (added === 0) {
      toast.error('None of the items from this order are available anymore')
      return
    }
    toast.success(`${added} item${added !== 1 ? 's' : ''} added to your cart — prices reflect today's menu`)
    if (skippedItems.length > 0) {
      toast.error(`No longer available, skipped: ${skippedItems.join(', ')}`, { duration: 6000 })
    }
    if (changedItems.length > 0) {
      toast(`Some options changed for: ${changedItems.join(', ')} — please review before checkout`, { icon: '⚠️', duration: 6000 })
    }
    goToCart()
  } catch {
    toast.error('Could not reorder — please try again')
  }
}
