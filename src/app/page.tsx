"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Clock,
  ChevronRight,
  Star,
  Truck,
  Award,
  Heart,
  Zap,
  Plus,
  Minus,
  MapPin,
} from "lucide-react";
import HeroBanners from "@/components/HeroBanners";
import CategoryIcon from "@/components/CategoryIcon";
import { openingHours } from "@/lib/menu-data";

type LiveCoupon = {
  code: string;
  type: string;
  value: number;
  description: string;
};
import { formatPrice } from "@/lib/utils";
import { useDeliveryCheck } from "@/lib/use-delivery-check";
import ProductModal from "@/components/ProductModal";
import type { Product, Category } from "@/lib/types";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { useCartStore } from "@/lib/cart-store";
import { useOrderType } from "@/context/OrderTypeContext";
import type { ShopStatus } from "@/lib/shop-status";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function HomeProductCard({
  product,
  badge,
  onSelect,
}: {
  product: Product;
  badge: string;
  onSelect: (p: Product) => void;
}) {
  const incrementSimpleProduct = useCartStore((s) => s.incrementSimpleProduct);
  const decrementSimpleProduct = useCartStore((s) => s.decrementSimpleProduct);
  const quantity = useCartStore((s) => s.getProductQuantity(product.id));
  const hasModifiers = product.modifiers.length > 0;

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasModifiers) onSelect(product);
    else incrementSimpleProduct(product);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    decrementSimpleProduct(product);
  };

  return (
    <motion.div
      variants={fadeUp}
      onClick={() => onSelect(product)}
      className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden cursor-pointer card-hover group"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-400"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute top-2 left-2 bg-[#FFD700] text-[#111] text-[10px] font-black px-2 py-0.5 rounded-full">
          {badge}
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-black text-gray-900 text-sm mb-2 line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="font-black text-gray-900 text-sm">
            {hasModifiers
              ? `From ${formatPrice(product.price)}`
              : formatPrice(product.price)}
          </span>
          {quantity > 0 && !hasModifiers ? (
            <div
              className="shrink-0 flex items-center gap-1.5 rounded-full h-7 px-1"
              style={{
                background: "var(--brand-accent)",
                color: "var(--brand-dark)",
              }}
            >
              <button
                onClick={handleDecrement}
                aria-label={`Remove one ${product.name}`}
                className="w-5 h-5 flex items-center justify-center shrink-0"
              >
                <Minus size={12} strokeWidth={3} />
              </button>
              <span className="font-black text-xs min-w-[1ch] text-center">
                {quantity}
              </span>
              <button
                onClick={handleQuickAction}
                aria-label={`Add another ${product.name}`}
                className="w-5 h-5 flex items-center justify-center shrink-0"
              >
                <Plus size={12} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickAction}
              aria-label={
                quantity > 0
                  ? `${quantity} in cart, add another`
                  : `Add ${product.name}`
              }
              className={`shrink-0 flex items-center justify-center font-black transition-colors ${
                quantity > 0
                  ? "h-7 min-w-7 px-2 rounded-full text-xs"
                  : "w-7 h-7 rounded-full"
              }`}
              style={
                quantity > 0
                  ? {
                      background: "var(--brand-accent)",
                      color: "var(--brand-dark)",
                    }
                  : { background: "var(--brand-dark)", color: "#fff" }
              }
            >
              {quantity > 0 ? quantity : <Plus size={14} strokeWidth={3} />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const cfg = useSiteConfig();
  const { orderType, setOrderType } = useOrderType();
  const cartSubtotal = useCartStore((s) => s.getSubtotal());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [mealDealProducts, setMealDealProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [liveCoupons, setLiveCoupons] = useState<LiveCoupon[]>([]);
  const {
    postcode,
    setPostcode,
    checking: checkingDelivery,
    result: deliveryResult,
    check: handleDeliveryCheck,
  } = useDeliveryCheck(cartSubtotal);

  useEffect(() => {
    fetch("/api/menu/products")
      .then((r) => r.json())
      .then((d) => {
        setPopularProducts(
          (d.products ?? []).filter((p: Product) => p.popular),
        );
        setMealDealProducts(
          (d.products ?? []).filter(
            (p: Product) => p.category === "pizza-meal",
          ),
        );
      });
    fetch("/api/menu/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
      });
    fetch("/api/shop-status")
      .then((r) => r.json())
      .then((d: ShopStatus) => {
        setShopStatus(d);
      })
      .catch(() => {});
    fetch("/api/coupons")
      .then((r) => r.json())
      .then((d) => {
        setLiveCoupons(d.coupons ?? []);
      })
      .catch(() => {});
  }, []);

  const open = shopStatus ? shopStatus.isOpen : false;
  const todayHours = shopStatus ? shopStatus.todayHours : "";


  return (
    <>
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* ── HERO BANNERS ─────────────────────────────────── */}
      <HeroBanners />

      {/* ── ORDER TYPE SELECTION ─────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 sm:p-6 border border-gray-100"
        >
          <h2 className="font-black text-gray-900 mb-4 text-base">
            How would you like your order?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: "delivery" as const,
                label: "Delivery",
                desc: "To your door",
                icon: "🚚",
                available: shopStatus ? shopStatus.deliveryEnabled : true,
              },
              {
                value: "collection" as const,
                label: "Collection",
                desc: "Pick up in-store",
                icon: "🏪",
                available: shopStatus ? shopStatus.collectionEnabled : true,
              },
            ].map((opt) => {
              const selected = orderType === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => opt.available && setOrderType(opt.value)}
                  disabled={!opt.available}
                  className={`relative p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-150 ${
                    !opt.available
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : selected
                        ? "border-red-500 bg-red-50"
                        : "border-gray-100 hover:border-gray-300 bg-white"
                  }`}
                >
                  {selected && (
                    <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-black">
                      ✓
                    </span>
                  )}
                  <div className="text-3xl mb-2">{opt.icon}</div>
                  <div className="font-black text-gray-900 text-sm sm:text-base">
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {opt.available ? opt.desc : "Currently unavailable"}
                  </div>
                </button>
              );
            })}
          </div>
          {orderType && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-green-600 font-bold mt-3"
            >
              ✅{" "}
              {orderType === "delivery"
                ? "Delivery selected — enter your postcode below"
                : "Collection selected — we'll have your order ready in 15–20 min"}
            </motion.p>
          )}
        </motion.div>
      </section>

      {/* ── DELIVERY CHECKER ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-5 sm:p-6 border border-gray-100"
        >
          <h2 className="font-black text-gray-900 mb-3 flex items-center gap-2 text-base">
            <MapPin size={17} className="text-[#E53935]" /> Check if we deliver
            to you
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleDeliveryCheck()}
              placeholder="Enter postcode e.g. TW18 1AB"
              className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-[#FFD700] transition-colors"
            />
            <button
              onClick={handleDeliveryCheck}
              disabled={checkingDelivery}
              className="btn-brand px-5 py-3 rounded-xl text-sm shrink-0 disabled:opacity-60"
            >
              {checkingDelivery ? "Checking…" : "Check"}
            </button>
          </div>

          {/* A postcode we can't check isn't a postcode we don't deliver to —
              don't push the customer to collection over a temporary glitch. */}
          {deliveryResult &&
            !deliveryResult.available &&
            deliveryResult.retryable && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                ⚠️{" "}
                {deliveryResult.message ??
                  "Something went wrong — please try again"}
              </motion.div>
            )}
          {deliveryResult &&
            !deliveryResult.available &&
            !deliveryResult.retryable && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                ❌{" "}
                {(
                  deliveryResult.message ??
                  "Sorry, we don't deliver to your area yet"
                ).replace(/[.!]+$/, "")}
                . You can still collect in-store!
              </motion.div>
            )}
          {deliveryResult?.available && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-semibold flex items-center gap-2"
            >
              {deliveryResult.freeDeliveryApplied ? (
                <>
                  🎉 We deliver to you — and your order qualifies for free
                  delivery!
                </>
              ) : (
                <>
                  ✅ We deliver to you! Fee:{" "}
                  {formatPrice(deliveryResult.deliveryFee ?? 0)} · Min order:{" "}
                  {formatPrice(deliveryResult.minOrder ?? 0)}
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── OPEN STATUS ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        {shopStatus && (
          <div
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-bold ${
              open ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${open ? "bg-green-500 pulse-dot" : "bg-gray-400"}`}
            />
            {open ? `We're Open · ${shopStatus.message}` : shopStatus.message}
          </div>
        )}
      </section>

      {/* ── CATEGORIES ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Browse Menu
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Find what you&apos;re craving
            </p>
          </div>
          <Link
            href="/menu"
            className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1"
          >
            View All <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {categories
            .filter((c) => c.visible)
            .slice(0, 6)
            .map((cat) => (
              <motion.div key={cat.id} variants={fadeUp}>
                <Link
                  href={`/menu?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#FFD700] hover:shadow-lg hover:shadow-yellow-100 transition-all duration-200 group card-hover"
                >
                  <CategoryIcon
                    slug={cat.slug}
                    icon={cat.icon}
                    image={cat.image}
                    size={48}
                    className="w-12 h-12 rounded-xl group-hover:scale-110 transition-transform duration-200"
                    emojiClassName="text-3xl group-hover:scale-110 transition-transform duration-200"
                  />
                  <span className="text-xs font-bold text-gray-700 text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
        </motion.div>
      </section>

      {/* ── OFFERS ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Special Offers
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Save more with our exclusive deals
            </p>
          </div>
          <Link
            href="/offers"
            className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1"
          >
            All Offers <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {liveCoupons.map((coupon) => (
            <motion.div
              key={coupon.code}
              variants={fadeUp}
              className="relative bg-[#111] text-white p-6 rounded-2xl overflow-hidden border border-white/8 hover:-translate-y-1 transition-transform duration-200"
            >
              {/* Decorative circles */}
              <div className="absolute right-0 top-0 w-28 h-28 bg-[#FFD700]/8 rounded-full -mr-10 -mt-10" />
              <div className="absolute right-8 bottom-0 w-20 h-20 bg-[#FFD700]/5 rounded-full -mb-10" />
              <div className="relative">
                <div className="text-3xl font-black text-[#FFD700] mb-2">
                  {coupon.type === "percentage" && `${coupon.value}% OFF`}
                  {coupon.type === "fixed" && `£${coupon.value} OFF`}
                  {coupon.type === "freeDelivery" && "FREE DELIVERY"}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {coupon.description}
                </p>
                <div className="inline-flex items-center gap-2 bg-[#FFD700]/15 border border-[#FFD700]/30 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-400">Code:</span>
                  <span className="font-black text-[#FFD700] tracking-wider">
                    {coupon.code}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── MEAL DEALS ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Meal Deals
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Great value combos for one or the whole family
            </p>
          </div>
          <Link
            href="/menu?category=pizza-meal"
            className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1"
          >
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {mealDealProducts.slice(0, 8).map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
              badge="Meal Deal"
              onSelect={setSelectedProduct}
            />
          ))}
        </motion.div>
      </section>

      {/* ── POPULAR PRODUCTS ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Most Popular
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Our customers can&apos;t get enough of these
            </p>
          </div>
          <Link
            href="/menu"
            className="text-[#E53935] font-bold text-sm hover:underline flex items-center gap-1"
          >
            See All <ChevronRight size={14} />
          </Link>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {popularProducts.slice(0, 8).map((product) => (
            <HomeProductCard
              key={product.id}
              product={product}
              badge="Popular"
              onSelect={setSelectedProduct}
            />
          ))}
        </motion.div>
      </section>

      {/* ── WHY US ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            Why Choose Pizza Guys?
          </h2>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              icon: <Zap size={26} className="text-[#FFD700]" />,
              bg: "bg-yellow-50",
              title: "Lightning Fast",
              desc: "30–45 min average delivery",
            },
            {
              icon: (
                <Star size={26} className="text-[#E53935]" fill="#E53935" />
              ),
              bg: "bg-red-50",
              title: "Top Rated",
              desc: "4.8★ from 2,000+ reviews",
            },
            {
              icon: <Heart size={26} className="text-pink-500" />,
              bg: "bg-pink-50",
              title: "Fresh Every Day",
              desc: "Made fresh to order",
            },
            {
              icon: <Award size={26} className="text-[#27AE60]" />,
              bg: "bg-green-50",
              title: "Since 2009",
              desc: "Trusted by local families",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              className="bg-white rounded-2xl p-5 sm:p-6 text-center border-2 border-gray-100 hover:border-[#FFD700] hover:shadow-lg hover:shadow-yellow-100 transition-all duration-200"
            >
              <div
                className={`${item.bg} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3`}
              >
                {item.icon}
              </div>
              <h3 className="font-black text-gray-900 mb-1 text-sm sm:text-base">
                {item.title}
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── OPENING HOURS ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[#111] text-white rounded-2xl p-6 sm:p-8 border border-white/8 overflow-hidden relative"
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#E53935] via-[#FFD700] to-[#27AE60]" />

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">
                Opening Hours
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Order online any time — we&apos;ll confirm when we&apos;re open
              </p>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                  open
                    ? "bg-green-500/15 text-green-400 border border-green-500/20"
                    : "bg-red-500/15 text-red-400 border border-red-500/20"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${open ? "bg-green-400 pulse-dot" : "bg-red-400"}`}
                />
                {open ? "Open Now" : "Currently Closed"}
              </div>
              <div className="mt-6">
                <Link
                  href="/menu"
                  className="btn-brand inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm"
                >
                  Order Now <ChevronRight size={15} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm w-full sm:w-auto">
              {openingHours.map((h) => (
                <div key={h.day} className="flex gap-4 items-center">
                  <span className="text-gray-500 w-10 shrink-0 text-xs">
                    {h.day.slice(0, 3)}
                  </span>
                  <span className="font-bold text-gray-200 text-xs">
                    {cfg[`hours_${h.day.slice(0, 3).toLowerCase()}_closed`] ===
                    "true"
                      ? "Closed"
                      : `${cfg[`hours_${h.day.slice(0, 3).toLowerCase()}_open`] || h.open}–${cfg[`hours_${h.day.slice(0, 3).toLowerCase()}_close`] || h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
