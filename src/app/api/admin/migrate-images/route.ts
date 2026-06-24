import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import prisma from '@/lib/prisma'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

function adminOnly(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

function normalize(p: { price: number; modifiers: string; allergens: string; [k: string]: unknown }) {
  return { ...p, price: p.price / 100, modifiers: JSON.parse(p.modifiers || '[]'), allergens: JSON.parse(p.allergens || '[]') }
}

/** GET — returns status: how many products have local vs cloudinary images */
export async function GET(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

  const products = await prisma.product.findMany({ select: { id: true, name: true, image: true } })
  const local      = products.filter((p) => p.image.startsWith('/images/'))
  const cloudinary = products.filter((p) => p.image.includes('cloudinary'))
  const empty      = products.filter((p) => !p.image)

  return NextResponse.json({
    total: products.length,
    local: local.length,
    cloudinary: cloudinary.length,
    empty: empty.length,
    pending: local.map((p) => ({ id: p.id, name: p.name, localPath: p.image })),
  })
}

/** POST — migrates one product's image to Cloudinary.  Body: { id: string } */
export async function POST(req: NextRequest) {
  const deny = adminOnly(req)
  if (deny) return deny

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Product id required' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  if (!product.image.startsWith('/images/')) {
    return NextResponse.json({ skipped: true, message: 'Already on Cloudinary or no local image' })
  }

  // Read file from disk (public/ directory)
  const filePath = join(process.cwd(), 'public', product.image)
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: `File not found on disk: ${product.image}` }, { status: 404 })
  }

  const buffer   = readFileSync(filePath)
  const ext      = product.image.split('.').pop() || 'avif'
  const mimeType = ext === 'avif' ? 'image/avif' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const base64   = `data:${mimeType};base64,${buffer.toString('base64')}`

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
  const apiKey    = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!
  const folder    = 'pizza-guys/products'
  const publicId  = id  // use product ID as Cloudinary public_id for easy reference

  const timestamp = Math.round(Date.now() / 1000).toString()
  const toSign    = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash('sha1').update(toSign).digest('hex')

  const body = new FormData()
  body.append('file',      base64)
  body.append('api_key',   apiKey)
  body.append('timestamp', timestamp)
  body.append('folder',    folder)
  body.append('public_id', publicId)
  body.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body,
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Cloudinary upload error for', id, ':', data)
    return NextResponse.json({ error: data?.error?.message ?? 'Upload failed', id }, { status: 500 })
  }

  const cloudinaryUrl = data.secure_url

  await prisma.product.update({
    where: { id },
    data:  { image: cloudinaryUrl },
  })

  const updated = await prisma.product.findUnique({ where: { id } })
  return NextResponse.json({ ok: true, id, cloudinaryUrl, product: updated ? normalize(updated) : null })
}
