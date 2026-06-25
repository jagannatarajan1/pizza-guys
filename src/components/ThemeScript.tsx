import type { SiteConfig } from '@/lib/site-config'
import { sanitizeColor } from '@/lib/site-config'

// Server component — renders a <style> tag in <head> with CSS variable overrides.
// All values are sanitized to valid hex only — no CSS injection possible.
export default function ThemeScript({ config }: { config: SiteConfig }) {
  const p = sanitizeColor(config.theme_primary, '#E53935')
  const a = sanitizeColor(config.theme_accent,  '#FFD700')
  const s = sanitizeColor(config.theme_success, '#27AE60')
  const d = sanitizeColor(config.theme_dark,    '#111111')

  const css = `:root{--brand-primary:${p};--brand-accent:${a};--brand-success:${s};--brand-dark:${d};}`

  return <style id="brand-theme" dangerouslySetInnerHTML={{ __html: css }} />
}
