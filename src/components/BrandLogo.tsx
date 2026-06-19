'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  size?: 'sm' | 'md'
  className?: string
}

export default function BrandLogo({ size = 'md', className = '' }: Props) {
  const [imgError, setImgError] = useState(false)
  const dim = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'
  const textSm = size === 'sm' ? 'text-lg' : 'text-xl'

  return (
    <Link href="/" className={`flex items-center gap-2.5 shrink-0 group ${className}`}>
      <div className={`relative ${dim} shrink-0`}>
        {!imgError ? (
          <Image
            src="/images/logo.png"
            alt="Pizza Guys"
            fill
            className="object-contain group-hover:scale-110 transition-transform duration-200"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`${dim} bg-[#FFD700] rounded-full flex items-center justify-center font-black text-[#111] text-base`}>
            PG
          </div>
        )}
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-black text-[#FFD700] ${textSm} tracking-tight leading-none`}>Pizza</span>
        <span className={`font-black text-white ${textSm} tracking-tight leading-none`}>Guys</span>
      </div>
    </Link>
  )
}
