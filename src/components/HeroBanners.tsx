'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Slide = {
  badge: string
  title: string
  accent: string
  subtitle: string
  cta: string
  ctaHref: string
  cta2?: string
  cta2Href?: string
  bg: string
  emoji: string[]
  image?: string
  imageAlt?: string
}

const SLIDES: Slide[] = [
  {
    badge: '🔥 Now Delivering',
    title: 'Real Pizza.',
    accent: 'Real Good.',
    subtitle: 'Freshly made with premium ingredients — delivered hot to your door in 30–45 minutes.',
    cta: 'Order Now',
    ctaHref: '/menu',
    cta2: 'View Offers',
    cta2Href: '/offers',
    bg: 'from-[#111] via-[#1a0a00] to-[#2a0f00]',
    emoji: ['🍕', '🌶️', '🧄'],
    image: '/images/banners/pizza-banner.png',
    imageAlt: 'Fresh pepperoni pizza with a cheesy pull',
  },
  {
    badge: '🍔 Fan Favourite',
    title: 'Smashed',
    accent: 'Burgers',
    subtitle: 'Juicy, char-grilled beef patties stacked high with melted cheese and all the trimmings.',
    cta: 'View Burgers',
    ctaHref: '/menu?category=burgers',
    bg: 'from-[#1a1000] via-[#2a1a00] to-[#111]',
    emoji: ['🍔', '🍟'],
    image: '/images/banners/burger-banner.png',
    imageAlt: 'Smashed burger with melted cheese and fries',
  },
]

const INTERVAL_MS = 5000

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: '0%', opacity: 1 },
  exit:   (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

export default function HeroBanners() {
  const [[index, direction], setSlide] = useState([0, 1])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((next: number, dir: number) => {
    setSlide([next, dir])
  }, [])

  const advance = useCallback(() => {
    setSlide(([i]) => [(i + 1) % SLIDES.length, 1])
  }, [])

  const prev = () => {
    go((index - 1 + SLIDES.length) % SLIDES.length, -1)
    resetTimer()
  }

  const next = () => {
    go((index + 1) % SLIDES.length, 1)
    resetTimer()
  }

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(advance, INTERVAL_MS)
  }

  useEffect(() => {
    timerRef.current = setInterval(advance, INTERVAL_MS)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [advance])

  const slide = SLIDES[index]

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 'min(88vh, 680px)' }}>
      {/* Slide content */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg} text-white flex items-center overflow-hidden`}
        >
          {slide.image && (
            <>
              <Image
                src={slide.image}
                alt={slide.imageAlt ?? ''}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/55 to-black/10 sm:from-black/90 sm:via-black/60 sm:to-transparent" />
            </>
          )}

          {/* Decorative emojis — skipped on photo slides so they don't clutter a real image */}
          {!slide.image && slide.emoji.map((em, i) => (
            <span
              key={i}
              className="absolute select-none hidden xl:block"
              style={{
                right: `${8 + i * 12}%`,
                top:   i % 2 === 0 ? '18%' : '55%',
                fontSize: `${4 - i * 0.6}rem`,
                opacity: 0.18,
                animation: `float ${3 + i}s ease-in-out infinite alternate`,
              }}
            >
              {em}
            </span>
          ))}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 w-full">
            <div className="max-w-2xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-6"
                style={{
                  background: 'color-mix(in srgb,var(--brand-accent) 15%,transparent)',
                  border: '1px solid color-mix(in srgb,var(--brand-accent) 30%,transparent)',
                  color: 'var(--brand-accent)',
                }}
              >
                {slide.badge}
              </div>

              {/* Title */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] mb-5 tracking-tight">
                {slide.title}<br />
                <span style={{ color: 'var(--brand-accent)' }}>{slide.accent}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-gray-300 mb-8 leading-relaxed max-w-xl">
                {slide.subtitle}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={slide.ctaHref}
                  className="btn-brand inline-flex items-center gap-2 px-7 py-3.5 text-base rounded-xl"
                >
                  {slide.cta} <ChevronRight size={18} />
                </Link>
                {slide.cta2 && (
                  <Link
                    href={slide.cta2Href!}
                    className="inline-flex items-center gap-2 px-7 py-3.5 text-base rounded-xl font-black bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all duration-150"
                  >
                    {slide.cta2}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { go(i, i > index ? 1 : -1); resetTimer() }}
            aria-label={`Slide ${i + 1}`}
            className="transition-all duration-300"
            style={{
              width:  i === index ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === index ? 'var(--brand-accent)' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
        <motion.div
          key={`progress-${index}`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: INTERVAL_MS / 1000, ease: 'linear' }}
          className="h-full"
          style={{ background: 'var(--brand-accent)' }}
        />
      </div>
    </section>
  )
}
