'use client'
import Link from 'next/link'
import { useSiteConfig } from '@/context/SiteConfigContext'

type Props = {
  size?: 'sm' | 'md'
  className?: string
}

export default function BrandLogo({ size = 'md', className = '' }: Props) {
  const cfg   = useSiteConfig()
  const dim   = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12'
  const textSm = size === 'sm' ? 'text-lg' : 'text-xl'
  const abbr  = (cfg.biz_logo_abbr || 'PG').slice(0, 3)
  const line1 = cfg.biz_logo_line1 || 'Pizza'
  const line2 = cfg.biz_logo_line2 || 'Guys'

  return (
    <Link href="/" className={`flex items-center gap-2.5 shrink-0 group ${className}`}>
      <div
        className={`${dim} rounded-full flex items-center justify-center font-black text-base group-hover:scale-110 transition-transform duration-200 shrink-0`}
        style={{ background: 'var(--brand-accent)', color: 'var(--brand-dark)' }}
      >
        {abbr}
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-black ${textSm} tracking-tight leading-none`} style={{ color: 'var(--brand-accent)' }}>{line1}</span>
        <span className={`font-black ${textSm} tracking-tight leading-none text-white`}>{line2}</span>
      </div>
    </Link>
  )
}
