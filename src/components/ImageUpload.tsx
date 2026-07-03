'use client'
import { useState } from 'react'
import Image from 'next/image'

type Props = {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ value, onChange, label = 'Image URL' }: Props) {
  const [input, setInput] = useState(value ?? '')

  const apply = () => {
    const trimmed = input.trim()
    onChange(trimmed)
  }

  const clear = () => {
    setInput('')
    onChange('')
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
      <p className="text-xs text-gray-400">Paste any public image URL (e.g. from your hosting, Imgur, etc.)</p>
    </div>
  )
}
