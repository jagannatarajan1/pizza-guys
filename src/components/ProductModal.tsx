'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Check, ChevronDown, UtensilsCrossed } from 'lucide-react'
import type { Product, ModifierGroup, ModifierOption } from '@/lib/types'
import type { CartItem, CartItemModifier } from '@/lib/cart-store'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import {
  activeGroups,
  maxPerOption,
  modifiersTotal,
  optionUnitPrice,
  validateSelections,
  type Selections,
} from '@/lib/modifier-pricing'
import toast from 'react-hot-toast'

type Props = {
  product: Product | null
  onClose: () => void
  // When set, the modal edits this existing cart line in place (pre-filling
  // its quantity/modifiers/instructions and saving via updateItem) instead of
  // always adding a brand-new line via addItem.
  editingItem?: CartItem | null
}

// Pre-fills the one obvious choice for a plain pick-one required group (pizza
// size, crust) so the customer opens the modal with Add to Cart already live,
// exactly like the reference flow — nothing to type, just change your mind if
// you want to. Groups that need an actual decision (pick 2 toppings, min > 1)
// are deliberately left empty. Runs in passes because picking a default can
// unlock a dependent group that itself needs a default.
function defaultSelections(product: Product): Selections {
  let sel: Selections = {}
  const passes = (product.modifiers?.length ?? 0) + 1
  for (let i = 0; i < passes; i++) {
    const active = activeGroups(product, sel)
    let changed = false
    for (const g of active) {
      if (g.required && !g.multiSelect && !(sel[g.id]?.length) && g.options.length > 0) {
        sel = { ...sel, [g.id]: [g.options[0].id] }
        changed = true
      }
    }
    if (!changed) break
  }
  return sel
}

// What to show in the collapsed row's pill — the whole point of collapsing a
// group is that you can still see what you picked without opening it back up.
function selectionSummary(group: ModifierGroup, chosen: string[]): string | null {
  if (chosen.length === 0) return null
  if (!group.multiSelect) {
    return group.options.find((o) => o.id === chosen[0])?.name ?? null
  }
  const counts = new Map<string, number>()
  for (const id of chosen) counts.set(id, (counts.get(id) ?? 0) + 1)
  const parts = [...counts.entries()].map(([id, n]) => {
    const name = group.options.find((o) => o.id === id)?.name ?? ''
    return n > 1 ? `${name} ×${n}` : name
  })
  if (parts.length <= 2) return parts.join(', ')
  return `${parts.slice(0, 2).join(', ')} +${parts.length - 2} more`
}

// Small square photo next to a topping/ingredient row. `option.image` only
// exists when the server matched this option's name to a real product photo
// (see /api/menu/products); most raw ingredients (salad, plain sauces) won't
// have one, so every row still gets a same-sized neutral placeholder rather
// than the list jumping around between rows with and without a photo.
function OptionThumb({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-gray-100">
      {src ? (
        <Image src={src} alt={alt} fill sizes="36px" className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <UtensilsCrossed size={15} />
        </div>
      )}
    </div>
  )
}

export default function ProductModal({ product, onClose, editingItem = null }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const updateItem = useCartStore((s) => s.updateItem)
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<Selections>({})
  const [instructions, setInstructions] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!product) return

    if (editingItem) {
      setQuantity(editingItem.quantity)
      setInstructions(editingItem.specialInstructions)
      const restored: Selections = {}
      editingItem.modifiers.forEach((m) => {
        restored[m.groupId] = m.options.map((o) => o.id)
      })
      setSelections(restored)
      const v = validateSelections(product, restored)
      setExpandedGroups(v.ok ? {} : { [v.groupId!]: true })
      return
    }

    setQuantity(1)
    setInstructions('')
    const defaults = defaultSelections(product)
    setSelections(defaults)
    // Only the section still blocking Add to Cart opens itself — everything
    // else (defaulted or genuinely optional) starts collapsed.
    const v = validateSelections(product, defaults)
    setExpandedGroups(v.ok ? {} : { [v.groupId!]: true })
  }, [product, editingItem])

  // Every active group renders at once — no step gating, so this is just
  // "all the customization the customer can currently see," recomputed live
  // (a dependent group like the meal drink appears the moment its trigger is
  // picked and disappears again if it's unpicked).
  const groups = product ? activeGroups(product, selections) : []

  // The single rulebook for "is this a legal, complete set of choices" — the
  // same function the server re-runs over whatever actually arrives. Required
  // groups need their minimum; optional groups are satisfied from empty, so
  // this is already exactly "all required selections made," nothing more.
  const verdict = product ? validateSelections(product, selections) : { ok: true as const }
  const readyToAdd = verdict.ok

  const total = product ? (product.price + modifiersTotal(product, selections)) * quantity : 0

  if (!product) return null

  const countOf = (groupId: string, optionId: string) =>
    (selections[groupId] ?? []).filter((id) => id === optionId).length

  const toggleExpanded = (groupId: string) =>
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))

  // Every change goes through here so a group that stops being offered can't
  // leave stale choices behind it — they would otherwise be quietly priced.
  const commit = (next: Selections) => {
    const liveIds = new Set(activeGroups(product, next).map((g) => g.id))
    const pruned: Selections = {}
    for (const [groupId, ids] of Object.entries(next)) {
      if (liveIds.has(groupId)) pruned[groupId] = ids
    }
    setSelections(pruned)
  }

  const chooseSingle = (group: ModifierGroup, optionId: string) => {
    commit({ ...selections, [group.id]: [optionId] })
  }

  const addOne = (group: ModifierGroup, optionId: string) => {
    const current = selections[group.id] ?? []
    if (group.max > 0 && current.length >= group.max) return
    if (countOf(group.id, optionId) >= maxPerOption(group)) return
    commit({ ...selections, [group.id]: [...current, optionId] })
  }

  const removeOne = (group: ModifierGroup, optionId: string) => {
    const current = selections[group.id] ?? []
    const idx = current.lastIndexOf(optionId)
    if (idx === -1) return
    commit({ ...selections, [group.id]: [...current.slice(0, idx), ...current.slice(idx + 1)] })
  }

  const toggleMulti = (group: ModifierGroup, optionId: string) => {
    const cap = maxPerOption(group)
    const have = countOf(group.id, optionId)
    if (cap === 1) {
      if (have > 0) removeOne(group, optionId)
      else addOne(group, optionId)
      return
    }
    addOne(group, optionId)
  }

  const handleAdd = () => {
    // Re-validated here regardless of the button's visual state — the same
    // check the button's enabled state is derived from, run fresh at the
    // moment of adding, so nothing incomplete can ever reach the cart.
    if (!verdict.ok) {
      toast.error(verdict.error)
      if (verdict.groupId) {
        const blockingId = verdict.groupId
        setExpandedGroups((prev) => ({ ...prev, [blockingId]: true }))
        requestAnimationFrame(() => {
          groupRefs.current[blockingId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
      }
      return
    }

    // Every option is stored with the price it was actually charged at — a
    // cheesy crust on a mega pizza costs more than on a medium, and the cart
    // line has to remember which one this was.
    const modifiers: CartItemModifier[] = groups
      .map((group) => {
        const chosen = selections[group.id] ?? []
        const options = chosen
          .map((optId) => group.options.find((o) => o.id === optId))
          .filter((o): o is ModifierOption => !!o)
          .map((o) => ({ ...o, price: optionUnitPrice(group, o, selections) }))
        return { groupId: group.id, groupName: group.name, options }
      })
      .filter((m) => m.options.length > 0)

    const itemTotal = total

    if (editingItem) {
      updateItem(editingItem.cartId, { product, quantity, modifiers, specialInstructions: instructions, itemTotal })
      toast.success(`${product.name} updated`)
    } else {
      addItem({ product, quantity, modifiers, specialInstructions: instructions, itemTotal })
      toast.success(`${product.name} added to cart`)
    }
    onClose()
  }

  const limitLabel = (group: ModifierGroup) => {
    const parts: string[] = []
    if (group.multiSelect && group.max > 1) parts.push(`Choose up to ${group.max}`)
    else if (group.multiSelect) parts.push('Choose any')
    else parts.push('Choose 1')
    if (maxPerOption(group) > 1) parts.push(`each up to ${maxPerOption(group)}×`)
    return parts.join(' · ')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Close button floats over everything and stays put while the image
            and details underneath it scroll as one unit — it's the only
            thing that's actually fixed here. */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors shadow"
        >
          <X size={18} />
        </button>

        {/* Image + content scroll together — the photo is not pinned, so on
            a large image it scrolls out of the way like the rest of the page. */}
        <div className="overflow-y-auto flex-1">
         <div className="relative aspect-[4/3] bg-gray-100">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🍕</div>
            )}
          </div>

          <div className="px-5 pt-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
            <p className="text-gray-500 text-sm font-semibold mb-2">From {formatPrice(product.price)}</p>
            {product.description && <p className="text-gray-500 text-sm mb-4">{product.description}</p>}

            {product.allergens && product.allergens.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <strong>Allergens:</strong> {product.allergens.join(', ')}
              </div>
            )}

            {/* Every applicable group is on the page at once — required and
                optional alike — as a collapsible row rather than a locked step.
                Nothing gates a later group behind an earlier one; the customer
                opens whatever they want to change, in whatever order, and Add
                to Cart in the footer is the only "next" they ever need. */}
            <div className="border-t border-gray-100">
              {groups.map((group) => {
                const chosen = selections[group.id] ?? []
                const atMax = group.max > 0 && chosen.length >= group.max
                const groupInvalid = !verdict.ok && verdict.groupId === group.id
                const expanded = !!expandedGroups[group.id]
                const summary = selectionSummary(group, chosen)
                const isGridStyle = !group.multiSelect
                const cap = maxPerOption(group)

                return (
                  <div
                    key={group.id}
                    ref={(el) => { groupRefs.current[group.id] = el }}
                    className={`border-b border-gray-100 ${groupInvalid ? 'bg-red-50/60 -mx-5 px-5' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpanded(group.id)}
                      className="w-full flex items-center justify-between gap-3 py-4 text-left"
                    >
                      <span className={`font-bold text-[15px] ${groupInvalid ? 'text-red-600' : 'text-gray-900'}`}>
                        {group.name}
                        {group.required ? (
                          <span className="text-red-500 ml-0.5">*</span>
                        ) : (
                          <span className="text-gray-400 font-medium text-xs ml-1.5">(Optional)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {summary ? (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-full px-2.5 py-1 max-w-[150px] truncate">
                            {summary}
                          </span>
                        ) : group.required ? (
                          <span className="text-xs font-semibold text-red-500 bg-red-50 rounded-full px-2.5 py-1">
                            Select
                          </span>
                        ) : null}
                        <ChevronDown
                          size={18}
                          className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                      </span>
                    </button>

                    {expanded && (
                      <div className="pb-4">
                        <p className="text-xs text-gray-500 mb-3">{group.description || limitLabel(group)}</p>

                        {isGridStyle ? (
                          <div className="grid grid-cols-2 gap-2">
                            {group.options.map((option) => {
                              const selected = countOf(group.id, option.id) > 0
                              const price = optionUnitPrice(group, option, selections)
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => chooseSingle(group, option.id)}
                                  className={`text-left p-3 rounded-xl border-2 transition-colors ${
                                    selected ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <span className="block text-sm font-semibold text-gray-800">{option.name}</span>
                                  {option.tag && (
                                    <span className="block text-[10px] font-bold uppercase tracking-wide text-amber-600 mt-0.5">
                                      {option.tag}
                                    </span>
                                  )}
                                  {price > 0 && (
                                    <span className="block text-xs text-gray-500 font-medium mt-1">+{formatPrice(price)}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {group.options.map((option) => {
                              const n = countOf(group.id, option.id)
                              const selected = n > 0
                              const price = optionUnitPrice(group, option, selections)
                              const canAddMore = !atMax && n < cap

                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-center justify-between gap-2 ${
                                    cap === 1
                                      ? `p-3 rounded-xl border-2 transition-all ${
                                          selected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50'
                                        }`
                                      : 'py-2'
                                  }`}
                                >
                                  {cap === 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleMulti(group, option.id)}
                                      disabled={!selected && atMax}
                                      className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:opacity-40"
                                    >
                                      <OptionThumb src={option.image} alt={option.name} />
                                      <div
                                        className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center ${
                                          selected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                                        }`}
                                      >
                                        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
                                      </div>
                                      <span className="text-sm font-medium text-gray-800 truncate">
                                        {option.name}
                                        {option.tag && (
                                          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                            {option.tag}
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <OptionThumb src={option.image} alt={option.name} />
                                      <span className="text-sm font-medium text-gray-800 truncate">
                                        {option.name}
                                        {option.tag && (
                                          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                            {option.tag}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 shrink-0">
                                    {price > 0 && (
                                      <span className="text-sm text-gray-500 font-semibold">+{formatPrice(price)}</span>
                                    )}
                                    {cap > 1 && (
                                      <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
                                        <button
                                          type="button"
                                          onClick={() => removeOne(group, option.id)}
                                          disabled={n === 0}
                                          aria-label={`Remove one ${option.name}`}
                                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"
                                        >
                                          <Minus size={12} />
                                        </button>
                                        <span className="w-4 text-center text-xs font-bold">{n}</span>
                                        <button
                                          type="button"
                                          onClick={() => addOne(group, option.id)}
                                          disabled={!canAddMore}
                                          aria-label={`Add one ${option.name}`}
                                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"
                                        >
                                          <Plus size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Special instructions — always visible; it's optional, so it
                never needs to be unlocked by anything else. */}
            <div className="py-4">
              <label className="block text-sm font-bold text-gray-800 mb-1">Special instructions</label>
              <p className="text-xs text-gray-500 mb-2">You may be charged for extras.</p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={300}
                placeholder="Any allergies or special requests? (optional)"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0">
          {/* Persistent, specific reason the button is greyed out — the
              customer shouldn't have to tap it to find out what's missing. */}
          {!readyToAdd && (
            <p className="text-xs font-semibold text-red-600 mb-2 text-center">{verdict.ok ? '' : verdict.error}</p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-base w-7 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAdd}
              aria-disabled={!readyToAdd}
              className={`flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-between px-5 transition-colors ${
                readyToAdd ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            >
              <span>{editingItem ? 'Update Cart' : 'Add to Cart'}</span>
              <span>{formatPrice(total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
