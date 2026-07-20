import Image from 'next/image'
import { getCategoryImage } from '@/lib/category-images'

type Props = {
  slug: string
  icon: string
  size: number
  className?: string
  emojiClassName?: string
}

// Renders a real photo for the category when we have one mapped, otherwise
// gracefully falls back to the emoji icon stored on the category.
export default function CategoryIcon({ slug, icon, size, className = '', emojiClassName = '' }: Props) {
  const image = getCategoryImage(slug)
  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className={`object-cover shrink-0 ${className}`}
      />
    )
  }
  return <span className={emojiClassName}>{icon}</span>
}
