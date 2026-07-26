import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { getSessionPayload } from '@/lib/auth-utils'

async function adminOnly(req: NextRequest) {
  const payload = await getSessionPayload(req)
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

// Files are written to /public/uploads so they're served directly by Next.js
// without a rebuild — required for this app's non-standalone `next start`
// deploy, and for admins to swap branding assets on a live VPS.
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'branding')
const MAX_BYTES  = 5 * 1024 * 1024 // 5MB

const ALLOWED_TYPES: Record<string, string> = {
  'image/png':                'png',
  'image/jpeg':                'jpg',
  'image/webp':                'webp',
  'image/svg+xml':             'svg',
  'image/x-icon':              'ico',
  'image/vnd.microsoft.icon':  'ico',
}

export async function POST(req: NextRequest) {
  const deny = await adminOnly(req)
  if (deny) return deny

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Unsupported file type. Use PNG, JPG, WEBP, SVG or ICO.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })

  // Filename is generated server-side, never derived from user input.
  const filename = `${randomUUID()}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(UPLOAD_DIR, filename), buffer)

  return NextResponse.json({ url: `/api/uploads/branding/${filename}` })
}
