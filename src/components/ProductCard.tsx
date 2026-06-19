'use client'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import type { Product } from '@/lib/menu-data'
import { formatPrice } from '@/lib/utils'

type Props = {
  product: Product
  onAdd: (product: Product) => void
}

export default function ProductCard({ product, onAdd }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.popular && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Popular
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</h3>
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900">
            {product.modifiers?.length ? `From ${formatPrice(product.price)}` : formatPrice(product.price)}
          </span>
          <button
            onClick={() => onAdd(product)}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
