'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'

type Props = {
  value?: string          // current image URL
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Product Image' }: Props) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)
    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: form })
    setUploading(false)

    if (!res.ok) {
      toast.error('Upload failed')
      return
    }

    const { url } = await res.json()
    onChange(url)
    toast.success('Image uploaded')
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>

      {/* Preview */}
      {value && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3 bg-gray-100">
          <Image src={value} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-gray-500 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-red-400 transition-colors"
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
            Uploading...
          </div>
        ) : (
          <div className="text-gray-400 text-sm">
            <div className="text-2xl mb-1">📷</div>
            <span className="text-red-600 font-semibold">Click to upload</span> or drag & drop
            <div className="text-xs mt-1">PNG, JPG, WEBP up to 5MB</div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
