import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

function normalize(p: {
  price: number
  modifiers: string
  allergens: string
  [key: string]: unknown
}) {
  return {
    ...p,
    price:     p.price / 100,
    modifiers: JSON.parse(p.modifiers  || '[]'),
    allergens: JSON.parse(p.allergens  || '[]'),
  }
}

export async function GET() {
  const products = await prisma.product.findMany({
    where:   { available: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ products: products.map(normalize) })
}
