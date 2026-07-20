'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

type Props = {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Image URL' }: Props) {
  const [input, setInput]       = useState(value ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const apply = () => {
    const trimmed = input.trim()
    onChange(trimmed)
  }

  const clear = () => {
    setInput('')
    onChange('')
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Upload failed'); return }
      setInput(data.url)
      onChange(data.url)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>

      {value && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
          <Image src={value} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-bold text-gray-600 shadow hover:text-red-600"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onBlur={apply}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          placeholder="Paste image URL…"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
        />
        <button
          type="button"
          onClick={apply}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          Set
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-100" />
        <span className="text-[11px] text-gray-400 font-semibold">OR</span>
        <div className="h-px flex-1 bg-gray-100" />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-red-300 disabled:opacity-50 text-gray-600 font-bold px-4 py-3 rounded-xl text-sm transition-colors"
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? 'Uploading…' : 'Upload a file from your device'}
      </button>
      <p className="text-xs text-gray-400">Uploaded files are stored on this server under /uploads — no external hosting needed.</p>
    </div>
  )
}
