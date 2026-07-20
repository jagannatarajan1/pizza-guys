import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

// Uploaded branding files are served through this route instead of directly
// from /public — `next start` on this Next.js version snapshots the public
// folder's file list at server boot, so files written at runtime (i.e. every
// admin upload) 404 until the process restarts. Reading them from disk on
// every request sidesteps that and makes uploads visible immediately.
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'branding')

const CONTENT_TYPES: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename: raw } = await params

  // Strip any directory components — only a bare filename we generated
  // ourselves (uuid + known extension) is ever valid here.
  const filename = path.basename(raw)
  const ext      = path.extname(filename).toLowerCase()
  const type     = CONTENT_TYPES[ext]
  if (!type || filename !== raw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const data = await readFile(path.join(UPLOAD_DIR, filename))
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type':  type,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}
