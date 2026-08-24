// Maps known category slugs to a representative photo already shipped in /public/images.
// The Category data model doesn't have a dedicated `image` field yet (only `icon`, an emoji),
// so this is a hand-picked, low-risk mapping using existing product photography.
// Categories not listed here (e.g. new ones added via the admin panel) simply fall back
// to rendering their emoji icon — see <CategoryIcon />.
export const CATEGORY_IMAGES: Record<string, string> = {
  'pizza':        '/images/Pizza/Margherita.avif',
  'meal-deals':   '/images/Pizza Meal/Big meal deal.avif',
  'burgers':      '/images/Burgers/Cheeseburger.avif',
  'kebab':        '/images/Kebab/Chicken Kebab.avif',
  'kebab-pizza':  '/images/Kebab Pizza specials/Kebab Pizza Specials.avif',
  'wraps':        '/images/Wraps/Chicken doner wrap.avif',
  'sides':        '/images/Sides/10 pcs onion rings.avif',
  'kids-meal':    '/images/Kids meal/Chicken nuggets meal.avif',
  'lunch-offers': '/images/Lunch TIme Offers/Any large pizza meal.avif',
  'desserts':     '/images/Dessert/Chocolate fudge cake.avif',
  'dips':         '/images/Dips/Garlic mayo.avif',
  'drinks':       '/images/Drinks/Coke.avif',
}

export function getCategoryImage(slug: string): string | null {
  return CATEGORY_IMAGES[slug] ?? null
}
