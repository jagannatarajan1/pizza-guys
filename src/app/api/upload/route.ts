import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { verifyToken, AUTH_COOKIE } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
  const apiKey    = process.env.CLOUDINARY_API_KEY!
  const apiSecret = process.env.CLOUDINARY_API_SECRET!

  const timestamp = Math.round(Date.now() / 1000).toString()
  const folder    = 'pizza-guys/products'

  // Build signature: alphabetically sorted params + secret
  const toSign    = `folder=${folder}&timestamp=${timestamp}${apiSecret}`
  const signature = createHash('sha1').update(toSign).digest('hex')

  const body = new FormData()
  body.append('file',      file)
  body.append('api_key',   apiKey)
  body.append('timestamp', timestamp)
  body.append('folder',    folder)
  body.append('signature', signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body }
  )

  const data = await res.json()

  if (!res.ok) {
    console.error('Cloudinary error:', data)
    return NextResponse.json({ error: data?.error?.message ?? 'Upload failed' }, { status: 500 })
  }

  return NextResponse.json({ url: data.secure_url, publicId: data.public_id })
}
