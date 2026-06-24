'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, Loader2, CloudUpload, Download, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

type PendingProduct = { id: string; name: string; localPath: string }
type ProductStatus  = { id: string; status: 'pending' | 'uploading' | 'done' | 'error'; url?: string; error?: string }

export default function MigrateImagesPage() {
  const [summary, setSummary]     = useState<{ total: number; local: number; cloudinary: number; empty: number } | null>(null)
  const [pending, setPending]     = useState<PendingProduct[]>([])
  const [statuses, setStatuses]   = useState<Record<string, ProductStatus>>({})
  const [running, setRunning]     = useState(false)
  const [done, setDone]           = useState(0)
  const [failed, setFailed]       = useState(0)
  const abortRef = useRef(false)

  const load = async () => {
    const res  = await fetch('/api/admin/migrate-images')
    const data = await res.json()
    setSummary({ total: data.total, local: data.local, cloudinary: data.cloudinary, empty: data.empty })
    setPending(data.pending ?? [])
    const init: Record<string, ProductStatus> = {}
    data.pending?.forEach((p: PendingProduct) => { init[p.id] = { id: p.id, status: 'pending' } })
    setStatuses(init)
    setDone(0)
    setFailed(0)
  }

  useEffect(() => { load() }, [])

  const migrateAll = async () => {
    if (running) return
    abortRef.current = false
    setRunning(true)
    setDone(0)
    setFailed(0)

    for (const product of pending) {
      if (abortRef.current) break

      setStatuses((prev) => ({ ...prev, [product.id]: { id: product.id, status: 'uploading' } }))

      try {
        const res  = await fetch('/api/admin/migrate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: product.id }),
        })
        const data = await res.json()

        if (res.ok && (data.ok || data.skipped)) {
          setStatuses((prev) => ({
            ...prev,
            [product.id]: { id: product.id, status: 'done', url: data.cloudinaryUrl },
          }))
          setDone((d) => d + 1)
        } else {
          setStatuses((prev) => ({
            ...prev,
            [product.id]: { id: product.id, status: 'error', error: data.error ?? 'Upload failed' },
          }))
          setFailed((f) => f + 1)
        }
      } catch {
        setStatuses((prev) => ({
          ...prev,
          [product.id]: { id: product.id, status: 'error', error: 'Network error' },
        }))
        setFailed((f) => f + 1)
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 400))
    }

    setRunning(false)
    if (!abortRef.current) {
      toast.success('Migration complete!')
      load()
    }
  }

  const stop = () => { abortRef.current = true; setRunning(false) }

  const migrateSingle = async (product: PendingProduct) => {
    setStatuses((prev) => ({ ...prev, [product.id]: { id: product.id, status: 'uploading' } }))
    const res  = await fetch('/api/admin/migrate-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      setStatuses((prev) => ({ ...prev, [product.id]: { id: product.id, status: 'done', url: data.cloudinaryUrl } }))
      toast.success(`${product.name} uploaded!`)
    } else {
      setStatuses((prev) => ({ ...prev, [product.id]: { id: product.id, status: 'error', error: data.error } }))
      toast.error(data.error ?? 'Upload failed')
    }
  }

  const allDone  = summary && summary.local === 0
  const progress = pending.length > 0 ? Math.round(((done + failed) / pending.length) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Migrate Images to Cloudinary</h1>
          <p className="text-sm text-gray-500 mt-0.5">Upload all local product images to Cloudinary CDN</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl font-black text-gray-900">{summary.total}</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">Total Products</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl font-black text-orange-500">{summary.local}</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">Local Images</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl font-black text-green-500">{summary.cloudinary}</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">On Cloudinary</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="text-2xl font-black text-gray-400">{summary.empty}</div>
            <div className="text-xs text-gray-500 font-semibold mt-1">No Image</div>
          </div>
        </div>
      )}

      {allDone ? (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center mb-6">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <h2 className="font-black text-green-800 text-xl mb-1">All images are on Cloudinary!</h2>
          <p className="text-green-600 text-sm">No local images remain. Your menu is fully dynamic.</p>
        </div>
      ) : (
        <>
          {/* Action bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">{pending.length} images need to be uploaded to Cloudinary</p>
              <p className="text-xs text-gray-500 mt-0.5">This uploads each image to your Cloudinary account and updates the database URL.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="/menu-images.zip"
                download
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Download size={15} /> Download ZIP
              </a>
              {running ? (
                <button onClick={stop} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Stop
                </button>
              ) : (
                <button onClick={migrateAll} className="flex items-center gap-2 bg-[#FFD700] hover:bg-yellow-400 text-[#111] font-black px-5 py-2.5 rounded-xl text-sm transition-colors">
                  <CloudUpload size={15} /> Migrate All
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {running && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#FFD700]" /> Uploading... {done + failed}/{pending.length}
                </span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#FFD700] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="text-green-600 font-bold">✓ {done} done</span>
                {failed > 0 && <span className="text-red-600 font-bold">✗ {failed} failed</span>}
              </div>
            </div>
          )}
        </>
      )}

      {/* Cloudinary note */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex items-start gap-3">
        <AlertTriangle size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700">
          <strong>Images are uploaded to:</strong> cloudinary.com → pizza-guys/products/<br />
          Each image uses the product ID as filename (e.g. <code>american-hot</code>).
          You can also <a href="/menu-images.zip" download className="underline font-bold">download the ZIP</a> to upload manually via the Cloudinary dashboard.
        </div>
      </div>

      {/* Product list */}
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
            <h2 className="text-xs font-black text-gray-500 uppercase">Pending Products</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.map((product) => {
              const st = statuses[product.id]
              return (
                <div key={product.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {st?.status === 'done' && st.url ? (
                      <Image src={st.url} alt={product.name} fill className="object-cover" />
                    ) : (
                      <Image
                        src={product.localPath}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Name + path */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate">{product.name}</div>
                    <div className="text-xs text-gray-400 font-mono truncate">
                      {st?.status === 'done' ? st.url : product.localPath}
                    </div>
                    {st?.status === 'error' && (
                      <div className="text-xs text-red-600 mt-0.5">✗ {st.error}</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="shrink-0">
                    {st?.status === 'uploading' && (
                      <Loader2 size={18} className="animate-spin text-[#FFD700]" />
                    )}
                    {st?.status === 'done' && (
                      <CheckCircle size={18} className="text-green-500" />
                    )}
                    {st?.status === 'error' && (
                      <button
                        onClick={() => migrateSingle(product)}
                        className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded-lg font-bold transition-colors flex items-center gap-1"
                      >
                        <XCircle size={12} /> Retry
                      </button>
                    )}
                    {(!st || st.status === 'pending') && !running && (
                      <button
                        onClick={() => migrateSingle(product)}
                        className="text-xs bg-gray-100 text-gray-600 hover:bg-[#FFD700] hover:text-[#111] px-3 py-1.5 rounded-lg font-bold transition-colors"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
