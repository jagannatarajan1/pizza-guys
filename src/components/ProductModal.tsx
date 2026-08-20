'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, Check, Pencil, ChevronRight } from 'lucide-react'
import type { Product, ModifierGroup, ModifierOption } from '@/lib/types'
import type { CartItem, CartItemModifier } from '@/lib/cart-store'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import {
  activeGroups,
  isGroupSatisfied,
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

const INSTRUCTIONS_STEP = '__instructions__'

export default function ProductModal({ product, onClose, editingItem = null }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const updateItem = useCartStore((s) => s.updateItem)
  const [quantity, setQuantity] = useState(1)
  const [selections, setSelections] = useState<Selections>({})
  const [doneGroups, setDoneGroups] = useState<string[]>([])
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [instructions, setInstructions] = useState('')
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollBodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!product) return
    setEditingGroupId(null)

    if (editingItem) {
      // Pre-fill from the existing cart line, then treat every step as already
      // answered so the customer lands on a full summary they can edit rather
      // than being walked through the whole flow again.
      setQuantity(editingItem.quantity)
      setInstructions(editingItem.specialInstructions)
      const restored: Selections = {}
      editingItem.modifiers.forEach((m) => {
        restored[m.groupId] = m.options.map((o) => o.id)
      })
      setSelections(restored)
      setDoneGroups(activeGroups(product, restored).map((g) => g.id))
      return
    }

    setQuantity(1)
    setInstructions('')
    setSelections({})
    setDoneGroups([])
  }, [product, editingItem])

  // Steps are recomputed from the current choices, so a group that depends on
  // another (the meal drink) appears the moment its trigger is picked and
  // disappears again if it is unpicked.
  const steps = useMemo(
    () => (product ? activeGroups(product, selections) : []),
    [product, selections]
  )

  const firstUnfinished = steps.find((g) => !doneGroups.includes(g.id)) ?? null
  const allStepsDone = steps.length > 0 && !firstUnfinished
  const currentStepId = editingGroupId ?? firstUnfinished?.id ?? INSTRUCTIONS_STEP

  const verdict = product ? validateSelections(product, selections) : { ok: true as const }
  const readyToAdd = verdict.ok && !firstUnfinished

  const total = product ? (product.price + modifiersTotal(product, selections)) * quantity : 0

  if (!product) return null

  const countOf = (groupId: string, optionId: string) =>
    (selections[groupId] ?? []).filter((id) => id === optionId).length

  // Every change goes through here so a step that stops being offered can't
  // leave stale choices behind it — they would otherwise be quietly priced, or
  // sit unanswered and block the Add button forever.
  const commit = (next: Selections) => {
    const liveIds = new Set(activeGroups(product, next).map((g) => g.id))
    const pruned: Selections = {}
    for (const [groupId, ids] of Object.entries(next)) {
      if (liveIds.has(groupId)) pruned[groupId] = ids
    }
    setSelections(pruned)
    setDoneGroups((prev) => prev.filter((id) => liveIds.has(id)))
  }

  const markDone = (groupId: string) => {
    setDoneGroups((prev) => (prev.includes(groupId) ? prev : [...prev, groupId]))
    setEditingGroupId(null)
  }

  const scrollToStep = (stepId: string) => {
    // Wait a frame so the newly-opened step has been laid out before scrolling.
    requestAnimationFrame(() => {
      stepRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  const chooseSingle = (group: ModifierGroup, optionId: string) => {
    commit({ ...selections, [group.id]: [optionId] })
    markDone(group.id)
    scrollToStep(INSTRUCTIONS_STEP)
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

  const skipStep = (group: ModifierGroup) => {
    commit({ ...selections, [group.id]: [] })
    markDone(group.id)
    scrollToStep(INSTRUCTIONS_STEP)
  }

  const handleAdd = () => {
    if (firstUnfinished) {
      setEditingGroupId(firstUnfinished.id)
      scrollToStep(firstUnfinished.id)
      return
    }
    if (!verdict.ok) {
      toast.error(verdict.error)
      if (verdict.groupId) {
        setEditingGroupId(verdict.groupId)
        scrollToStep(verdict.groupId)
      }
      return
    }

    // Every option is stored with the price it was actually charged at — a
    // cheesy crust on a mega pizza costs more than on a medium, and the cart
    // line has to remember which one this was.
    const modifiers: CartItemModifier[] = steps
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

  const summaryFor = (group: ModifierGroup) => {
    const chosen = selections[group.id] ?? []
    if (chosen.length === 0) return 'Skipped'
    const counts = new Map<string, number>()
    chosen.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1))
    return [...counts.entries()]
      .map(([id, n]) => {
        const name = group.options.find((o) => o.id === id)?.name ?? id
        return n > 1 ? `${name} ×${n}` : name
      })
      .join(', ')
  }

  const limitLabel = (group: ModifierGroup) => {
    const parts: string[] = []
    if (group.multiSelect && group.max > 1) parts.push(`Choose up to ${group.max}`)
    else parts.push('Choose 1')
    if (maxPerOption(group) > 1) parts.push(`each up to ${maxPerOption(group)}×`)
    parts.push(group.required ? 'Required' : 'Optional')
    return parts.join(' · ')
  }

  const stepNumber = (group: ModifierGroup) => steps.findIndex((g) => g.id === group.id) + 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Image */}
        <div className="relative aspect-video shrink-0">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors shadow"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div ref={scrollBodyRef} className="overflow-y-auto flex-1 p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h2>
          {product.description && <p className="text-gray-500 text-sm mb-4">{product.description}</p>}

          {product.allergens && product.allergens.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>Allergens:</strong> {product.allergens.join(', ')}
            </div>
          )}

          {steps.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              {allStepsDone
                ? `All ${steps.length} step${steps.length === 1 ? '' : 's'} complete`
                : `Step ${stepNumber(firstUnfinished ?? steps[0])} of ${steps.length}`}
            </p>
          )}

          {/* One step at a time: finished steps collapse to a summary, the
              current one is open, and later ones stay hidden until reached. */}
          {steps.map((group) => {
            const isOpen = currentStepId === group.id
            const isDone = doneGroups.includes(group.id)
            if (!isOpen && !isDone) return null

            if (!isOpen) {
              return (
                <div
                  key={group.id}
                  ref={(el) => { stepRefs.current[group.id] = el }}
                  className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Check size={14} className="text-green-600 shrink-0" />
                      <span className="text-sm font-bold text-gray-800 truncate">{group.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 break-words">{summaryFor(group)}</p>
                  </div>
                  <button
                    onClick={() => { setEditingGroupId(group.id); scrollToStep(group.id) }}
                    className="shrink-0 flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                </div>
              )
            }

            const chosen = selections[group.id] ?? []
            const atMax = group.max > 0 && chosen.length >= group.max
            const canContinue = isGroupSatisfied(group, selections)

            return (
              <div
                key={group.id}
                ref={(el) => { stepRefs.current[group.id] = el }}
                className="mb-5 rounded-xl border-2 border-red-100 bg-white p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-gray-900">
                    <span className="text-red-600 mr-1.5">{stepNumber(group)}.</span>{group.name}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      group.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {group.required ? 'Required' : 'Optional'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{group.description || limitLabel(group)}</p>

                <div className="space-y-2">
                  {group.options.map((option) => {
                    const n = countOf(group.id, option.id)
                    const selected = n > 0
                    const price = optionUnitPrice(group, option, selections)
                    const cap = maxPerOption(group)
                    const canAddMore = !atMax && n < cap

                    return (
                      <div
                        key={option.id}
                        className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all ${
                          selected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            group.multiSelect ? toggleMulti(group, option.id) : chooseSingle(group, option.id)
                          }
                          // Only a multi-pick step can run out of room. On a
                          // pick-one step the choice replaces whatever was
                          // there, so its other options must stay clickable —
                          // otherwise editing a size would lock you into the
                          // one already chosen.
                          disabled={group.multiSelect && !selected && atMax}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:opacity-40"
                        >
                          <div
                            className={`w-5 h-5 shrink-0 border-2 flex items-center justify-center ${
                              group.multiSelect ? 'rounded-md' : 'rounded-full'
                            } ${selected ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}
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

                {/* Single-choice steps advance on tap, so they need no footer.
                    Everything else needs an explicit way forward. */}
                {(group.multiSelect || !group.required) && (
                  <div className="flex items-center gap-2 mt-3">
                    {group.multiSelect && (
                      <button
                        type="button"
                        onClick={() => { markDone(group.id); scrollToStep(INSTRUCTIONS_STEP) }}
                        disabled={!canContinue}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors ${
                          canContinue ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        Continue <ChevronRight size={15} />
                      </button>
                    )}
                    {!group.required && (
                      <button
                        type="button"
                        onClick={() => skipStep(group)}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Special instructions — the final step, only once the choices are in */}
          {(allStepsDone || steps.length === 0) && (
            <div ref={(el) => { stepRefs.current[INSTRUCTIONS_STEP] = el }} className="mb-2">
              <label className="block text-sm font-bold text-gray-800 mb-1">
                {steps.length > 0 && <span className="text-red-600 mr-1.5">{steps.length + 1}.</span>}
                Special instructions
              </label>
              <p className="text-xs text-gray-500 mb-2">You may be charged for extras.</p>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                maxLength={300}
                placeholder="Any allergies or special requests? (optional)"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-red-400"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-gray-500 text-sm flex-1">Select quantity</span>
          </div>
          <button
            onClick={handleAdd}
            aria-disabled={!readyToAdd}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-between px-5 transition-colors ${
              readyToAdd ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            <span>{editingItem ? 'Update Cart' : 'Add to Cart'}</span>
            <span>{formatPrice(total)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
