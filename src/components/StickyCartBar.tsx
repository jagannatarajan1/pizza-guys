'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

// Global sticky bar pinned to the bottom of the viewport whenever the basket
// has items in it. Reuses the same cart store the header badge uses, so the
// count always stays in sync. Hidden on the cart page itself (no point
// telling you to go to the cart while you're already there).
export default function StickyCartBar() {
  const itemCount = useCartStore((s) => s.getItemCount())
  const pathname  = usePathname()

  const show = itemCount > 0 && pathname !== '/cart'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 sm:pb-5 pointer-events-none"
        >
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <Link
              href="/cart"
              className="flex items-center justify-between gap-3 bg-[#111] text-white px-5 py-3.5 sm:py-4 rounded-2xl shadow-2xl shadow-black/30 border border-white/10 hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-150"
            >
              <span className="flex items-center gap-3">
                <span className="bg-[#FFD700] text-[#111] w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                  <ShoppingCart size={16} strokeWidth={2.5} />
                </span>
                <span className="font-black text-sm sm:text-base">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
                </span>
              </span>
              <span className="flex items-center gap-1 font-black text-[#FFD700] text-sm">
                View Basket <ChevronRight size={16} />
              </span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
