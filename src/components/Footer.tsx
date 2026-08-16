"use client";
import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { mapEmbedSrc } from "@/lib/utils";

// lucide-react and heroicons deliberately exclude brand/company logos, so
// these social glyphs are hand-drawn minimal SVGs (not raster brand assets).
const FacebookIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
  </svg>
);
const InstagramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);
const XIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.24 2.5h3.31l-7.23 8.26 8.5 10.74h-6.66l-5.22-6.63-5.97 6.63H1.66l7.73-8.83L1.24 2.5h6.83l4.72 6.06 5.45-6.06Zm-1.16 17h1.83L7.02 4.4H5.06l12.02 15.1Z" />
  </svg>
);
const TikTokIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M16.6 2h-3.2v13.9c0 1.5-1.2 2.7-2.7 2.7s-2.7-1.2-2.7-2.7 1.2-2.7 2.7-2.7c.28 0 .55.04.8.12V10c-.26-.03-.53-.05-.8-.05-3.1 0-5.6 2.5-5.6 5.6S7.5 21.15 10.6 21.15s5.6-2.5 5.6-5.6V8.4c1.2.86 2.67 1.37 4.26 1.37V6.6c-2.14 0-3.86-1.74-3.86-3.9V2Z" />
  </svg>
);

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/offers", label: "Special Offers" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

const infoLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/allergens", label: "Allergy Information" },
  { href: "/dashboard", label: "My Account" },
];

export default function Footer() {
  const cfg = useSiteConfig();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const socials = [
    { icon: FacebookIcon, title: "Facebook", href: cfg.social_facebook },
    { icon: InstagramIcon, title: "Instagram", href: cfg.social_instagram },
    { icon: XIcon, title: "X/Twitter", href: cfg.social_twitter },
    { icon: TikTokIcon, title: "TikTok", href: cfg.social_tiktok },
  ].filter((s) => s.href);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer
      className="text-gray-400 mt-20"
      style={{ background: "var(--brand-dark)" }}
    >
      {/* Top colour bar */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(to right, var(--brand-primary), var(--brand-accent), var(--brand-success))`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + Newsletter */}
          <div>
            <div className="mb-5">
              <BrandLogo size="md" />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              {cfg.biz_tagline}
            </p>

            {/* Social icons */}
            {socials.length > 0 && (
              <div className="flex gap-2 mb-6">
                {socials.map((s) => (
                  <a
                    key={s.title}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.title}
                    aria-label={s.title}
                    className="w-9 h-9 bg-white/6 text-gray-400 rounded-xl flex items-center justify-center transition-all duration-150 hover:text-(--brand-dark)"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--brand-accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "";
                    }}
                  >
                    <s.icon />
                  </a>
                ))}
              </div>
            )}

            {/* Newsletter */}
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest mb-2">
                Newsletter
              </p>
              {subscribed ? (
                <p className="text-xs text-green-400 font-bold">
                  Thank you for subscribing! 🎉
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    required
                    className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <button
                    type="submit"
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: "var(--brand-accent)",
                      color: "var(--brand-dark)",
                    }}
                    aria-label="Subscribe"
                  >
                    <Send size={13} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">
              Quick Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:text-(--brand-accent) transition-colors flex items-center gap-2 group"
                  >
                    <span
                      className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--brand-accent)" }}
                    />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info links */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">
              Information
            </h3>
            <ul className="space-y-2.5 text-sm">
              {infoLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="hover:text-(--brand-accent) transition-colors flex items-center gap-2 group"
                  >
                    <span
                      className="w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--brand-accent)" }}
                    />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + hours */}
          <div>
            <h3 className="font-black text-white mb-4 text-sm uppercase tracking-widest">
              Get In Touch
            </h3>
            <ul className="space-y-3 text-sm mb-5">
              <li className="flex items-start gap-3">
                <MapPin
                  size={15}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--brand-accent)" }}
                />
                <span className="leading-snug">{cfg.biz_address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone
                  size={15}
                  className="shrink-0"
                  style={{ color: "var(--brand-accent)" }}
                />
                <div className="flex flex-col gap-0.5">
                  <a
                    href={`tel:${cfg.biz_phone.replace(/\s/g, "")}`}
                    className="hover:text-(--brand-accent) transition-colors"
                  >
                    {cfg.biz_phone}
                  </a>
                  {cfg.biz_phone2 && (
                    <a
                      href={`tel:${cfg.biz_phone2.replace(/\s/g, "")}`}
                      className="hover:text-(--brand-accent) transition-colors"
                    >
                      {cfg.biz_phone2}
                    </a>
                  )}
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail
                  size={15}
                  className="shrink-0"
                  style={{ color: "var(--brand-accent)" }}
                />
                <a
                  href={`mailto:${cfg.biz_email}`}
                  className="hover:text-(--brand-accent) transition-colors"
                >
                  {cfg.biz_email}
                </a>
              </li>
            </ul>

            <div className="bg-white/5 rounded-xl p-4 text-xs border border-white/8">
              <div className="flex items-center gap-2 font-black text-white mb-2">
                <Clock size={13} style={{ color: "var(--brand-accent)" }} />{" "}
                Opening Hours
              </div>
              <div className="space-y-1 text-gray-400">
                {[
                  { label: "Mon", key: "mon" },
                  { label: "Tue", key: "tue" },
                  { label: "Wed", key: "wed" },
                  { label: "Thu", key: "thu" },
                  { label: "Fri", key: "fri" },
                  { label: "Sat", key: "sat" },
                  { label: "Sun", key: "sun" },
                ].map(({ label, key }) => {
                  const closed = cfg[`hours_${key}_closed`] === "true";
                  const open = cfg[`hours_${key}_open`] || "11:00";
                  const close = cfg[`hours_${key}_close`] || "23:00";
                  return (
                    <div key={key} className="flex justify-between">
                      <span>{label}</span>
                      <span
                        className={
                          closed ? "text-gray-600" : "text-white font-bold"
                        }
                      >
                        {closed ? "Closed" : `${open} – ${close}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Find us — full-width strip below the columns, so the columns above
            stay level instead of the map lopsidedly stretching one of them */}
        <div className="mt-12 pt-8 border-t border-white/8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-white text-sm uppercase tracking-widest">
              Find Us
            </h3>
            <a
              href={
                cfg.biz_map_link ||
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.biz_address)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/10 transition-colors"
              style={{ color: "var(--brand-accent)" }}
            >
              <MapPin size={12} /> Get Directions
            </a>
          </div>
          <div className="rounded-xl overflow-hidden border border-white/8 h-36 sm:h-44">
            <iframe
              src={mapEmbedSrc(cfg.biz_map_lat, cfg.biz_map_lng, cfg.google_maps_api_key, cfg.biz_map_embed_url)}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Pizza Guys location"
            />
          </div>
        </div>

        <div className="border-t border-white/8 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-600">
          <p>
            © {new Date().getFullYear()} {cfg.biz_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
