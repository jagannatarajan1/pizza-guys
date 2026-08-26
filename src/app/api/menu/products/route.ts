import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { ModifierGroup } from '@/lib/types'

// "Pepperoni" the topping and "Pepperoni Feast" the pizza are different
// strings, so this strips parenthetical qualifiers and punctuation down to
// bare words before comparing — good enough to match "Garlic Mayo" the sauce
// option to "Garlic Mayo" the dip product without over-matching unrelated
// items.
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

// Reuses a real product's photo for a modifier option that shares its name —
// e.g. the "Garlic Mayo" dip's photo backs the "Garlic Mayo" sauce choice on
// a kebab. Only options with a genuine name match get an image; everything
// else (raw salad, generic sauces) is left for the UI to show a placeholder.
function attachOptionImages(modifiers: ModifierGroup[], imageByName: Map<string, string>): ModifierGroup[] {
  return modifiers.map((group) => ({
    ...group,
    options: group.options.map((option) => {
      const image = imageByName.get(normalizeName(option.name))
      return image ? { ...option, image } : option
    }),
  }))
}

function normalize(
  p: { price: number; modifiers: string; allergens: string; [key: string]: unknown },
  imageByName: Map<string, string>
) {
  return {
    ...p,
    price:     p.price / 100,
    modifiers: attachOptionImages(JSON.parse(p.modifiers || '[]'), imageByName),
    allergens: JSON.parse(p.allergens || '[]'),
  }
}

export async function GET() {
  const products = await prisma.product.findMany({
    where:   { available: true },
    orderBy: { createdAt: 'asc' },
  })

  const imageByName = new Map<string, string>()
  for (const p of products) {
    if (p.image) imageByName.set(normalizeName(p.name), p.image)
  }

  return NextResponse.json({ products: products.map((p) => normalize(p, imageByName)) })
}
