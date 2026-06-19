import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  // Only allow authenticated users to upload
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  const body = new URLSearchParams({
    file: base64,
    upload_preset: 'pizza_guys',       // create this preset in Cloudinary dashboard
    folder: 'pizza-guys/products',
  })

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json({ url: data.secure_url, publicId: data.public_id })
}
