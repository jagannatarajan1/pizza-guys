'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus, Minus, ChevronDown } from 'lucide-react'
import type { Product, ModifierGroup, ModifierOption } from '@/lib/types'
import type { CartItemModifier } from '@/lib/cart-store'
import { useCartStore } from '@/lib/cart-store'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

type Props = {
  product: Product | null
  onClose: () => void
}

export default function ProductModal({ product, onClose }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({})
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    if (!product) return
    setQuantity(1)
    setInstructions('')
    const defaults: Record<string, string[]> = {}
    product.modifiers?.forEach((group) => {
      if (group.required && group.options.length > 0) {
        defaults[group.id] = [group.options[0].id]
      } else {
        defaults[group.id] = []
      }
    })
    setSelectedModifiers(defaults)
  }, [product])

  if (!product) return null

  const toggleOption = (group: ModifierGroup, optionId: string) => {
    setSelectedModifiers((prev) => {
      const current = prev[group.id] || []
      if (group.multiSelect) {
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter((id) => id !== optionId) }
        } else if (current.length < group.max) {
          return { ...prev, [group.id]: [...current, optionId] }
        }
        return prev
      } else {
        return { ...prev, [group.id]: current.includes(optionId) ? [] : [optionId] }
      }
    })
  }

  const computeTotal = () => {
    let total = product.price
    product.modifiers?.forEach((group) => {
      const selected = selectedModifiers[group.id] || []
      selected.forEach((optId) => {
        const opt = group.options.find((o) => o.id === optId)
        if (opt) total += opt.price
      })
    })
    return total * quantity
  }

  const canAdd = () => {
    if (!product.modifiers) return true
    return product.modifiers.every((group) => {
      if (!group.required) return true
      return (selectedModifiers[group.id] || []).length >= group.min
    })
  }

  const handleAdd = () => {
    const modifiers: CartItemModifier[] = (product.modifiers || []).map((group) => {
      const selectedIds = selectedModifiers[group.id] || []
      const options = group.options.filter((o) => selectedIds.includes(o.id))
      return { groupId: group.id, groupName: group.name, options }
    }).filter((m) => m.options.length > 0)

    const itemTotal = computeTotal()

    addItem({ product, quantity, modifiers, specialInstructions: instructions, itemTotal })
    toast.success(`${product.name} added to basket`)
    onClose()
  }

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
            className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full p-2 hover:bg-white transition-colors shadow"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{product.name}</h2>
          <p className="text-gray-500 text-sm mb-4">{product.description}</p>

          {product.allergens && product.allergens.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>Allergens:</strong> {product.allergens.join(', ')}
            </div>
          )}

          {/* Modifier groups */}
          {product.modifiers?.map((group) => (
            <div key={group.id} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800">{group.name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${group.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  {group.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const selected = (selectedModifiers[group.id] || []).includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(group, option.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        selected
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selected ? 'border-red-500 bg-red-500' : 'border-gray-300'
                          }`}
                        >
                          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{option.name}</span>
                      </div>
                      {option.price > 0 && (
                        <span className="text-sm text-gray-500 font-medium">+{formatPrice(option.price)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Special instructions */}
          <div className="mb-2">
            <label className="block text-sm font-bold text-gray-800 mb-2">Special Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Any allergies or special requests? (optional)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:border-red-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="font-bold text-lg w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-gray-500 text-sm flex-1">Select quantity</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!canAdd()}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-between px-5 transition-colors ${
              canAdd() ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <span>Add to Basket</span>
            <span>{formatPrice(computeTotal())}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
