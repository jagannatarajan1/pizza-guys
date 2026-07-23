'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Palette, Store, Sparkles, Users, Share2, Clock, Search, Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { DEFAULTS } from '@/lib/site-config'

type Config = Record<string, string>

const TABS = [
  { id: 'theme',    label: 'Theme',    icon: Palette   },
  { id: 'business', label: 'Business', icon: Store     },
  { id: 'hero',     label: 'Hero',     icon: Sparkles  },
  { id: 'about',    label: 'About',    icon: Users     },
  { id: 'social',   label: 'Social',   icon: Share2    },
  { id: 'hours',    label: 'Hours',    icon: Clock     },
  { id: 'seo',      label: 'SEO',      icon: Search    },
]

// ─── Shared field components ────────────────────────────────

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-(--brand-accent) transition-colors"
    />
  )
}

function Textarea({ value, onChange, rows = 4, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-(--brand-accent) transition-colors resize-none"
    />
  )
}

function ColorField({ label, value, onChange, note }: { label: string; value: string; onChange: (v: string) => void; note?: string }) {
  const isValid = /^#[0-9A-Fa-f]{3,8}$/.test(value)
  return (
    <div>
      <label className="block text-xs font-black text-gray-700 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={isValid ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-11 h-11 rounded-xl border-2 border-gray-200 cursor-pointer p-0.5 bg-white"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={9}
          className={`w-36 border-2 rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none transition-colors ${isValid ? 'border-gray-100 focus:border-(--brand-accent)' : 'border-red-300 focus:border-red-400'}`}
        />
        <div className="w-8 h-8 rounded-lg border border-gray-200 shrink-0" style={{ background: isValid ? value : '#ccc' }} />
      </div>
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
    </div>
  )
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {title && (
        <div className="mb-5">
          <h3 className="font-black text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

function SaveBar({ onSave, onReset, saving, keys }: { onSave: (keys: string[]) => void; onReset: (keys: string[]) => void; saving: boolean; keys: string[] }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-5 border-t border-gray-100 mt-5">
      <button
        onClick={() => onReset(keys)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
      >
        <RotateCcw size={14} /> Reset to Default
      </button>
      <button
        onClick={() => onSave(keys)}
        disabled={saving}
        className="flex items-center gap-2 bg-[var(--brand-accent)] hover:brightness-90 text-[var(--brand-dark)] font-black px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

// ─── Tab panels ────────────────────────────────────────────

function ThemeTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const keys = ['theme_primary', 'theme_accent', 'theme_success', 'theme_dark']
  return (
    <div className="space-y-6">
      <SectionCard title="Brand Colours" description="These colours are applied across the entire website. Changes take effect on the next page load.">
        <div className="grid sm:grid-cols-2 gap-6">
          <ColorField label="Accent Colour" value={cfg.theme_accent} onChange={(v) => set('theme_accent', v)} note="Used for buttons, highlights, active nav, card hover borders" />
          <ColorField label="Primary / Alert Colour" value={cfg.theme_primary} onChange={(v) => set('theme_primary', v)} note="Used for cart badge, error states, danger actions" />
          <ColorField label="Success Colour" value={cfg.theme_success} onChange={(v) => set('theme_success', v)} note="Used for 'Open Now' indicators, success messages" />
          <ColorField label="Dark Background" value={cfg.theme_dark} onChange={(v) => set('theme_dark', v)} note="Used for header, footer, hero, dark sections" />
        </div>

        {/* Live preview */}
        <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden">
          <div className="text-xs font-black text-gray-400 px-4 py-2 bg-gray-50 border-b border-gray-200 uppercase tracking-wide">Live Preview</div>
          <div className="p-5" style={{ background: cfg.theme_dark || '#111' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0" style={{ background: cfg.theme_accent, color: cfg.theme_dark }}>PG</div>
              <span className="font-black text-sm" style={{ color: cfg.theme_accent }}>Pizza Guys</span>
              <span className="ml-auto text-xs px-2 py-1 rounded-full font-black" style={{ background: cfg.theme_success, color: '#fff' }}>Open Now</span>
            </div>
            <p className="text-xs mb-4" style={{ color: '#aaa' }}>Handmade pizzas, sizzling burgers & fresh kebabs…</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl text-sm font-black transition-all" style={{ background: cfg.theme_accent, color: cfg.theme_dark }}>Order Now</button>
              <button className="px-4 py-2 rounded-xl text-sm font-black border" style={{ borderColor: cfg.theme_primary, color: cfg.theme_primary }}>View Menu</button>
            </div>
          </div>
        </div>

        <SaveBar onSave={save} onReset={reset} saving={saving} keys={keys} />
      </SectionCard>
    </div>
  )
}

function BusinessTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const keys = ['biz_name', 'biz_logo_line1', 'biz_logo_line2', 'biz_logo_abbr', 'biz_tagline', 'biz_phone', 'biz_email', 'biz_address', 'biz_founded']
  return (
    <div className="space-y-5">
      <SectionCard title="Business Identity">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Business Name"><Input value={cfg.biz_name} onChange={(v) => set('biz_name', v)} placeholder="Pizza Guys" /></Field>
          <Field label="Founded Year"><Input value={cfg.biz_founded} onChange={(v) => set('biz_founded', v)} placeholder="2009" /></Field>
          <Field label="Logo Line 1" note="First word in the logo text"><Input value={cfg.biz_logo_line1} onChange={(v) => set('biz_logo_line1', v)} placeholder="Pizza" /></Field>
          <Field label="Logo Line 2" note="Second word in the logo text"><Input value={cfg.biz_logo_line2} onChange={(v) => set('biz_logo_line2', v)} placeholder="Guys" /></Field>
          <Field label="Logo Abbreviation" note="Fallback monogram if no image uploaded"><Input value={cfg.biz_logo_abbr} onChange={(v) => set('biz_logo_abbr', v)} placeholder="PG" /></Field>
        </div>
        <div className="mt-5">
          <Field label="Brand Tagline" note="Shown in the footer below the logo">
            <Textarea value={cfg.biz_tagline} onChange={(v) => set('biz_tagline', v)} rows={2} />
          </Field>
        </div>
        <SaveBar onSave={save} onReset={reset} saving={saving} keys={keys} />
      </SectionCard>

      <SectionCard title="Contact Details">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Primary Phone"><Input value={cfg.biz_phone} onChange={(v) => set('biz_phone', v)} placeholder="01784 452 888" type="tel" /></Field>
          <Field label="Secondary Phone" note="Optional — shown alongside primary number"><Input value={cfg.biz_phone2 ?? ''} onChange={(v) => set('biz_phone2', v)} placeholder="01784 452 999" type="tel" /></Field>
          <Field label="Email Address"><Input value={cfg.biz_email} onChange={(v) => set('biz_email', v)} placeholder="info@pizzaguys.co.uk" type="email" /></Field>
        </div>
        <div className="mt-5">
          <Field label="Full Address">
            <Textarea value={cfg.biz_address} onChange={(v) => set('biz_address', v)} rows={2} placeholder="209 Laleham Rd, Shepperton, TW17 0AH" />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Directions Link" note="Paste your Google Maps share link (open your location in Google Maps, tap Share, copy the link) — used for the 'Get Directions' button">
            <Input value={cfg.biz_map_link ?? ''} onChange={(v) => set('biz_map_link', v)} placeholder="https://maps.app.goo.gl/..." type="url" />
          </Field>
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-5">
          <Field label="Map Latitude" note="Only needed if the shop moves — right-click your location on Google Maps and copy the first number">
            <Input value={cfg.biz_map_lat ?? ''} onChange={(v) => set('biz_map_lat', v)} placeholder="51.4003305" />
          </Field>
          <Field label="Map Longitude" note="The second number from the same Google Maps right-click">
            <Input value={cfg.biz_map_lng ?? ''} onChange={(v) => set('biz_map_lng', v)} placeholder="-0.4590982" />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Google Maps API Key" note="Optional — paste a free key here to show the real Google Map on your site instead of the basic free map. Leave blank and the basic map keeps working.">
            <Input value={cfg.google_maps_api_key ?? ''} onChange={(v) => set('google_maps_api_key', v)} placeholder="AIzaSy..." />
          </Field>
        </div>
        <SaveBar onSave={save} onReset={reset} saving={saving} keys={['biz_phone', 'biz_phone2', 'biz_email', 'biz_address', 'biz_map_link', 'biz_map_lat', 'biz_map_lng', 'google_maps_api_key']} />
      </SectionCard>
    </div>
  )
}

function HeroTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const keys = ['hero_badge', 'hero_title', 'hero_title_accent', 'hero_subtitle', 'hero_cta1', 'hero_cta2', 'hero_stat1', 'hero_stat2', 'hero_stat3']
  return (
    <div className="space-y-5">
      <SectionCard title="Hero Banner" description="The main banner on your home page">
        <div className="space-y-5">
          <Field label="Badge Text" note="Small pill above the headline, e.g. '🔥 Hot & Fresh Since 2009'">
            <Input value={cfg.hero_badge} onChange={(v) => set('hero_badge', v)} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Headline Line 1"><Input value={cfg.hero_title} onChange={(v) => set('hero_title', v)} placeholder="Real Pizza." /></Field>
            <Field label="Headline Line 2 (accent colour)" note="Displayed in your accent colour"><Input value={cfg.hero_title_accent} onChange={(v) => set('hero_title_accent', v)} placeholder="Real Good." /></Field>
          </div>
          <Field label="Subtitle / Description">
            <Textarea value={cfg.hero_subtitle} onChange={(v) => set('hero_subtitle', v)} rows={3} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Primary CTA Button" note="Main action button"><Input value={cfg.hero_cta1} onChange={(v) => set('hero_cta1', v)} placeholder="Order Now" /></Field>
            <Field label="Secondary CTA Button"><Input value={cfg.hero_cta2} onChange={(v) => set('hero_cta2', v)} placeholder="View Menu" /></Field>
          </div>
        </div>
        <SaveBar onSave={save} onReset={reset} saving={saving} keys={keys} />
      </SectionCard>

      <SectionCard title="Hero Statistics" description="Three trust-builder stats shown below the buttons">
        <div className="grid sm:grid-cols-3 gap-5">
          <Field label="Stat 1"><Input value={cfg.hero_stat1} onChange={(v) => set('hero_stat1', v)} placeholder="Fast delivery" /></Field>
          <Field label="Stat 2"><Input value={cfg.hero_stat2} onChange={(v) => set('hero_stat2', v)} placeholder="4.8 rating" /></Field>
          <Field label="Stat 3"><Input value={cfg.hero_stat3} onChange={(v) => set('hero_stat3', v)} placeholder="30–45 min" /></Field>
        </div>
        <SaveBar onSave={save} onReset={reset} saving={saving} keys={['hero_stat1', 'hero_stat2', 'hero_stat3']} />
      </SectionCard>
    </div>
  )
}

function AboutTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const statKeys = ['about_stat1_val', 'about_stat1_lbl', 'about_stat2_val', 'about_stat2_lbl', 'about_stat3_val', 'about_stat3_lbl', 'about_stat4_val', 'about_stat4_lbl']
  return (
    <div className="space-y-5">
      <SectionCard title="About Page Statistics" description="The four numbers displayed on the About page">
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex gap-4">
              <div className="flex-1">
                <Field label={`Stat ${n} Value`}><Input value={cfg[`about_stat${n}_val`]} onChange={(v) => set(`about_stat${n}_val`, v)} placeholder="15+" /></Field>
              </div>
              <div className="flex-1">
                <Field label="Label"><Input value={cfg[`about_stat${n}_lbl`]} onChange={(v) => set(`about_stat${n}_lbl`, v)} placeholder="Years in Business" /></Field>
              </div>
            </div>
          ))}
        </div>
        <SaveBar onSave={save} onReset={reset} saving={saving} keys={statKeys} />
      </SectionCard>

      <SectionCard title="Our Story" description="The text on the About page. Use blank lines to separate paragraphs.">
        <Textarea value={cfg.about_story} onChange={(v) => set('about_story', v)} rows={10} />
        <SaveBar onSave={save} onReset={reset} saving={saving} keys={['about_story']} />
      </SectionCard>
    </div>
  )
}

function SocialTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const keys = ['social_facebook', 'social_instagram', 'social_twitter', 'social_tiktok']
  return (
    <SectionCard title="Social Media Links" description="Leave blank to hide a social icon from the footer">
      <div className="space-y-5">
        <Field label="Facebook URL"><Input value={cfg.social_facebook} onChange={(v) => set('social_facebook', v)} placeholder="https://facebook.com/pizzaguys" type="url" /></Field>
        <Field label="Instagram URL"><Input value={cfg.social_instagram} onChange={(v) => set('social_instagram', v)} placeholder="https://instagram.com/pizzaguys" type="url" /></Field>
        <Field label="Twitter / X URL"><Input value={cfg.social_twitter} onChange={(v) => set('social_twitter', v)} placeholder="https://x.com/pizzaguys" type="url" /></Field>
        <Field label="TikTok URL"><Input value={cfg.social_tiktok ?? ''} onChange={(v) => set('social_tiktok', v)} placeholder="https://tiktok.com/@pizzaguys" type="url" /></Field>
      </div>
      <SaveBar onSave={save} onReset={reset} saving={saving} keys={keys} />
    </SectionCard>
  )
}

const HOUR_DAYS = [
  { key: 'mon', label: 'Monday'    },
  { key: 'tue', label: 'Tuesday'   },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday'  },
  { key: 'fri', label: 'Friday'    },
  { key: 'sat', label: 'Saturday'  },
  { key: 'sun', label: 'Sunday'    },
] as const

function HoursTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const keys = HOUR_DAYS.flatMap((d) => [
    `hours_${d.key}_open`,
    `hours_${d.key}_close`,
    `hours_${d.key}_closed`,
  ])
  return (
    <SectionCard title="Opening Hours" description="Set individual times for each day. Toggle the switch to mark a day as closed.">
      <div className="space-y-2">
        {HOUR_DAYS.map((day) => {
          const closedKey = `hours_${day.key}_closed`
          const openKey   = `hours_${day.key}_open`
          const closeKey  = `hours_${day.key}_close`
          const isClosed  = cfg[closedKey] === 'true'
          return (
            <div
              key={day.key}
              className={`grid grid-cols-[160px_1fr] gap-3 items-center p-3 rounded-xl border transition-all ${isClosed ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100'}`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set(closedKey, isClosed ? 'false' : 'true')}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${isClosed ? 'bg-gray-300' : 'bg-green-500'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 ${isClosed ? '' : 'translate-x-4'}`} />
                </button>
                <span className="font-black text-sm text-gray-700">{day.label}</span>
              </div>
              {isClosed ? (
                <span className="text-sm text-gray-400 italic">Closed</span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-semibold">From</span>
                  <input
                    type="time"
                    value={cfg[openKey] || '11:00'}
                    onChange={(e) => set(openKey, e.target.value)}
                    className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-(--brand-accent) transition-colors"
                  />
                  <span className="text-gray-300">–</span>
                  <span className="text-xs text-gray-400 font-semibold">To</span>
                  <input
                    type="time"
                    value={cfg[closeKey] || '23:00'}
                    onChange={(e) => set(closeKey, e.target.value)}
                    className="border-2 border-gray-100 rounded-xl px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-(--brand-accent) transition-colors"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <SaveBar onSave={save} onReset={reset} saving={saving} keys={keys} />
    </SectionCard>
  )
}

function SeoTab({ cfg, set, save, reset, saving }: { cfg: Config; set: (k: string, v: string) => void; save: (keys: string[]) => void; reset: (keys: string[]) => void; saving: boolean }) {
  const keys = ['seo_title', 'seo_description']
  const titleLen = (cfg.seo_title || '').length
  const descLen  = (cfg.seo_description || '').length
  return (
    <SectionCard title="Search Engine Optimisation" description="Controls the page title and description shown in Google results">
      <div className="space-y-5">
        <Field label="Page Title" note={`${titleLen}/60 characters recommended`}>
          <Input value={cfg.seo_title} onChange={(v) => set('seo_title', v)} placeholder="Pizza Guys | Fresh Pizzas, Burgers & More" />
          <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${titleLen > 60 ? 'bg-red-400' : titleLen > 40 ? 'bg-green-400' : 'bg-yellow-300'}`} style={{ width: `${Math.min((titleLen / 70) * 100, 100)}%` }} />
          </div>
        </Field>
        <Field label="Meta Description" note={`${descLen}/160 characters recommended`}>
          <Textarea value={cfg.seo_description} onChange={(v) => set('seo_description', v)} rows={3} />
          <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${descLen > 160 ? 'bg-red-400' : descLen > 100 ? 'bg-green-400' : 'bg-yellow-300'}`} style={{ width: `${Math.min((descLen / 180) * 100, 100)}%` }} />
          </div>
        </Field>

        {/* Google preview */}
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-5 bg-gray-50">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-3">Google Preview</p>
          <p className="text-blue-700 text-lg font-normal leading-snug truncate">{cfg.seo_title || 'Page Title'}</p>
          <p className="text-green-700 text-xs mt-0.5">pizzaguys.co.uk</p>
          <p className="text-gray-600 text-sm mt-1 leading-relaxed line-clamp-2">{cfg.seo_description || 'Meta description will appear here…'}</p>
        </div>
      </div>
      <SaveBar onSave={save} onReset={reset} saving={saving} keys={keys} />
    </SectionCard>
  )
}

// ─── Main page ─────────────────────────────────────────────

export default function AdminSettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('theme')
  const [config, setConfig]       = useState<Config>({})
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    fetch('/api/admin/site-config')
      .then((r) => r.json())
      .then((d) => { setConfig(d.config ?? {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const set = useCallback((key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  const save = useCallback(async (keys: string[]) => {
    setSaving(true)
    const updates: Config = {}
    keys.forEach((k) => { updates[k] = config[k] ?? '' })
    try {
      const res  = await fetch('/api/admin/site-config', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setConfig(data.config)
      router.refresh() // re-fetches site config used by the header/footer/logo/etc. so changes show up immediately
      toast.success('Saved!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [config, router])

  const reset = useCallback((keys: string[]) => {
    setConfig((prev) => {
      const next = { ...prev }
      keys.forEach((k) => { if (k in DEFAULTS) next[k] = DEFAULTS[k] })
      return next
    })
    toast('Reset to defaults — click Save to apply.', { icon: '↩️' })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-3">
        <Loader2 size={22} className="animate-spin" /> Loading settings…
      </div>
    )
  }

  const tabProps = { cfg: config, set, save, reset, saving }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Site Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Control theme colours, content, and SEO for every page</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1.5 mb-6 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                active
                  ? 'bg-[var(--brand-accent)] text-[var(--brand-dark)] shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white/70'
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'theme'    && <ThemeTab    {...tabProps} />}
      {activeTab === 'business' && <BusinessTab {...tabProps} />}
      {activeTab === 'hero'     && <HeroTab     {...tabProps} />}
      {activeTab === 'about'    && <AboutTab    {...tabProps} />}
      {activeTab === 'social'   && <SocialTab   {...tabProps} />}
      {activeTab === 'hours'    && <HoursTab    {...tabProps} />}
      {activeTab === 'seo'      && <SeoTab      {...tabProps} />}
    </div>
  )
}
