import Image from 'next/image'
import { getCategoryImage } from '@/lib/category-images'

type Props = {
  slug: string
  icon: string
  image?: string
  size: number
  className?: string
  emojiClassName?: string
}

// Prefers an admin-set image on the category, falls back to a built-in photo
// mapping for known slugs, and finally falls back to the emoji icon.
export default function CategoryIcon({ slug, icon, image, size, className = '', emojiClassName = '' }: Props) {
  const src = image || getCategoryImage(slug)
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        className={`object-cover shrink-0 ${className}`}
      />
    )
  }
  return <span className={emojiClassName}>{icon}</span>
}
