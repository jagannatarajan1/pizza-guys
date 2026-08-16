import { cache } from 'react'

export type SiteConfig = Record<string, string>

export const DEFAULTS: SiteConfig = {
  // ── Theme ─────────────────────────────────────────────────
  theme_primary:      '#E53935',
  theme_accent:       '#FFD700',
  theme_success:      '#27AE60',
  theme_dark:         '#111111',

  // ── Business ──────────────────────────────────────────────
  biz_name:           'Pizza Guys',
  biz_logo_image:     '',
  biz_favicon_image:  '',
  biz_logo_line1:     'Pizza',
  biz_logo_line2:     'Guys',
  biz_logo_abbr:      'PG',
  biz_tagline:        'Fresh handmade pizzas, juicy burgers & sizzling kebabs delivered hot to your door. Family-run since 2009.',
  biz_phone:          '01784 452 888',
  biz_phone2:         '',
  biz_email:          'info@pizzaguys.co.uk',
  biz_address:        '209 Laleham Rd, Shepperton, TW17 0AH',
  biz_founded:        '2009',
  biz_map_lat:        '51.4003305',
  biz_map_lng:        '-0.4590982',
  biz_map_link:       'https://maps.app.goo.gl/7bKEz5rrXfhDsTY4A',
  // The map shown on the site, taken from Google Maps' own "Share → Embed a
  // map" iframe. Preferred over the lat/lng fallbacks because it needs no API
  // key and points at the business listing itself.
  biz_map_embed_url:  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d151.11539838523973!2d-0.45938428491355787!3d51.400295654448165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4876750063a52ce1%3A0x4dc27756a7fef18a!2sPizza%20guys!5e1!3m2!1sen!2sjp!4v1786840894249!5m2!1sen!2sjp',
  google_maps_api_key: '',
  delivery_max_radius_miles: '3',
  // Delivery fee is automatically waived once the cart subtotal reaches this
  // amount (pounds). '0' means the feature is off — every order pays the
  // normal per-band fee.
  free_delivery_threshold: '0',

  // ── Hero ──────────────────────────────────────────────────
  hero_badge:         '🔥 Hot & Fresh Since 2009',
  hero_title:         'Real Pizza.',
  hero_title_accent:  'Real Good.',
  hero_subtitle:      'Handmade pizzas, sizzling burgers & fresh kebabs delivered hot to your door in Staines & surrounding areas.',
  hero_cta1:          'Order Now',
  hero_cta2:          'View Menu',
  hero_stat1:         'Fast delivery',
  hero_stat2:         '4.8 rating',
  hero_stat3:         '30–45 min',

  // ── About ─────────────────────────────────────────────────
  about_stat1_val:    '15+',
  about_stat1_lbl:    'Years in Business',
  about_stat2_val:    '200K+',
  about_stat2_lbl:    'Meals Served',
  about_stat3_val:    '4.8★',
  about_stat3_lbl:    'Average Rating',
  about_stat4_val:    '30 min',
  about_stat4_lbl:    'Avg Delivery',
  about_story:        "Pizza Guys was founded in 2009 with a simple mission: to serve the best handmade pizzas, burgers, and kebabs to the families of Staines and surrounding areas. What started as a small local takeaway has grown into a much-loved institution in our community.\n\nWe believe that great food starts with great ingredients. That's why we source fresh produce daily, make our dough in-house every morning, and use authentic recipes refined over 15+ years.\n\nToday, we're proud to have served over 200,000 meals and counting. From birthday parties to weeknight dinners, Pizza Guys has been part of thousands of family moments across Surrey and Middlesex.",

  // ── Social ────────────────────────────────────────────────
  social_facebook:    '',
  social_instagram:   '',
  social_twitter:     '',
  social_tiktok:      '',

  // ── Shop Status ───────────────────────────────────────────
  shop_open:          'true',   // manual override: false = temporarily closed
  shop_delivery:      'true',
  shop_collection:    'true',

  // ── Per-day Opening Hours ────────────────────────────────
  hours_mon_open:     '11:00',
  hours_mon_close:    '23:00',
  hours_mon_closed:   'false',
  hours_tue_open:     '11:00',
  hours_tue_close:    '23:00',
  hours_tue_closed:   'false',
  hours_wed_open:     '11:00',
  hours_wed_close:    '23:00',
  hours_wed_closed:   'false',
  hours_thu_open:     '11:00',
  hours_thu_close:    '23:00',
  hours_thu_closed:   'false',
  hours_fri_open:     '11:00',
  hours_fri_close:    '23:30',
  hours_fri_closed:   'false',
  hours_sat_open:     '11:00',
  hours_sat_close:    '23:30',
  hours_sat_closed:   'false',
  hours_sun_open:     '12:00',
  hours_sun_close:    '23:00',
  hours_sun_closed:   'false',

  // ── SEO ───────────────────────────────────────────────────
  seo_title:          'Pizza Guys | Fresh Pizzas, Burgers & More',
  seo_description:    'Order pizza, burgers, kebabs and more from Pizza Guys. Hot, fresh food delivered to your door. Available in TW18, TW19, TW20 and surrounding areas.',
}

const HEX_RE = /^#[0-9A-Fa-f]{3,8}$/
const COLOR_KEYS = new Set(['theme_primary', 'theme_accent', 'theme_success', 'theme_dark'])

/** Only allow valid hex colors — prevents CSS injection */
export function sanitizeColor(value: string, fallback: string): string {
  const v = (value ?? '').trim()
  return HEX_RE.test(v) ? v : fallback
}

/** Strip HTML tags and enforce length limit — prevents stored XSS */
export function sanitizeText(value: string, maxLen = 2000): string {
  return String(value ?? '').replace(/<[^>]*>/g, '').slice(0, maxLen)
}

export function sanitizeConfigValue(key: string, value: string): string {
  if (COLOR_KEYS.has(key)) return sanitizeColor(value, DEFAULTS[key] ?? '#000000')
  return sanitizeText(value)
}

export function withDefaults(partial: Partial<SiteConfig>): SiteConfig {
  const merged: SiteConfig = { ...DEFAULTS }
  for (const [k, v] of Object.entries(partial)) {
    if (v !== undefined) merged[k] = v
  }
  return merged
}

/** Server-side fetch — cached per request via React cache() */
export const fetchSiteConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const { default: prisma } = await import('./prisma')
    const rows = await prisma.siteConfig.findMany()
    const config: SiteConfig = {}
    rows.forEach((r: { key: string; value: string }) => { config[r.key] = r.value })
    return withDefaults(config)
  } catch {
    return { ...DEFAULTS }
  }
})
