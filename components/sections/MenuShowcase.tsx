"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { SITE_CONTENT, MenuItem } from "@/lib/content";

type MenuCategory = "coffee" | "cold" | "tea" | "pastries";

const CATEGORIES: { id: MenuCategory; label: string }[] = [
  { id: "coffee", label: "Coffee" },
  { id: "cold", label: "Cold Brew" },
  { id: "tea", label: "Tea" },
  { id: "pastries", label: "Pastries" },
];

const FOCAL_POSITIONS: Record<string, string> = {
  "/images/menu-pourover.webp": "22% 62%",
  "/images/menu-ambercaramel.webp": "37% 50%",
  "/images/menu-matcha.webp": "60% 30%",
};

function SafeItemImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 900px",
  objectPosition,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  objectPosition?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`relative h-full w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#5A1420] via-[#3E0D16] to-[#2E0A10] text-cream text-center ${
          className || ""
        }`}
      >
        <span className="font-serif text-sm text-gold font-medium mb-1">Aurelia Reserve</span>
        <span className="text-[9px] uppercase tracking-widest text-blush/60 font-sans">Craft Selection</span>
      </div>
    );
  }

  const effectivePosition = objectPosition || FOCAL_POSITIONS[src] || "center center";

  return (
    <div className="relative w-full h-full bg-[#3E0D16]/60 overflow-hidden flex items-center justify-center">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        style={{ objectPosition: effectivePosition }}
        className={`object-cover warm-grade transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className || ""}`}
      />
    </div>
  );
}

export function MenuShowcase() {
  const [activeCategory, setActiveCategory] = useState<MenuCategory>("coffee");
  const [hoveredRowItem, setHoveredRowItem] = useState<MenuItem | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect fine pointer device
    if (typeof window !== "undefined") {
      const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      setIsPointerDevice(hasFinePointer);
    }

    // Preload menu images during browser idle
    const preloadImages = () => {
      SITE_CONTENT.menu.forEach((item) => {
        if (typeof window !== "undefined" && item.image) {
          const img = new window.Image();
          img.src = item.image;
        }
      });
    };

    if (typeof window !== "undefined") {
      const win = window as Window & { requestIdleCallback?: (cb: () => void) => void };
      if (typeof win.requestIdleCallback === "function") {
        win.requestIdleCallback(preloadImages);
      } else {
        setTimeout(preloadImages, 2000);
      }
    }
  }, []);

  const preloadCategory = (catId: MenuCategory) => {
    SITE_CONTENT.menu
      .filter((item) => item.category === catId)
      .forEach((item) => {
        if (typeof window !== "undefined" && item.image) {
          const img = new window.Image();
          img.src = item.image;
        }
      });
  };

  const filteredItems = SITE_CONTENT.menu.filter(
    (item) => item.category === activeCategory
  );

  const featuredItems = filteredItems.slice(0, 3);

  const handleAddToCart = (name: string, price: string) => {
    setCartToast(`${name} (${price})`);
    setTimeout(() => {
      setCartToast(null);
    }, 2800);
  };

  const handleMouseMoveList = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isPointerDevice || !previewRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 36;
    const y = e.clientY - rect.top;
    previewRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  return (
    <section
      id="menu"
      data-section="menu"
      ref={containerRef}
      onMouseMove={handleMouseMoveList}
      className="relative w-full bg-[#FAF5EE] py-24 md:py-32 px-6 sm:px-12 lg:px-20 text-[#2B1A17] overflow-hidden select-none z-20"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      {/* Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-8 right-8 z-[9990] flex items-center gap-3 rounded-full bg-[#2E0A10]/95 border border-gold/40 px-6 py-3.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center text-gold">
            <Check size={14} />
          </div>
          <p className="font-sans text-xs tracking-wider text-cream">
            Added <span className="font-semibold text-gold">{cartToast}</span> to your order
          </p>
        </div>
      )}

      {/* Floating Hover Image for Editorial List View (Desktop pointer only, 480px) */}
      {isPointerDevice && hoveredRowItem && (
        <div
          ref={previewRef}
          className="pointer-events-none absolute z-40 hidden md:block w-48 h-60 rounded-xl overflow-hidden shadow-2xl border border-[#2B1A17]/20 transition-opacity duration-200 bg-[#3E0D16] left-0 top-0 will-change-transform"
        >
          <SafeItemImage
            src={hoveredRowItem.image}
            alt={hoveredRowItem.name}
            sizes="480px"
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 pb-8 border-b border-[#2B1A17]/15">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-gold-dark" />
              <span className="eyebrow-badge !text-taupe">
                THE MENU
              </span>
            </div>
            <h2 className="font-editorial-headline text-3xl sm:text-5xl md:text-6xl text-[#2B1A17] tracking-tight">
              The <span className="italic font-normal text-gold-dark">Composition</span>
            </h2>
          </div>
          <p className="font-editorial-body text-taupe text-sm sm:text-base max-w-md font-light leading-relaxed">
            Meticulous extractions, botanical infusions, and morning viennoiserie curated for the reflective palate.
          </p>
        </div>

        {/* Category Tabs with Sliding Gold Pill Indicator & Hover Preloading */}
        <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#2B1A17]/5 border border-[#2B1A17]/10 w-full sm:w-fit mb-10 sm:mb-12 overflow-x-auto snap-x snap-mandatory flex-nowrap no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setHoveredRowItem(null);
                }}
                onMouseEnter={() => preloadCategory(cat.id)}
                className={`relative px-5 sm:px-7 py-2.5 text-xs uppercase tracking-[0.2em] font-sans font-medium transition-colors cursor-pointer rounded-full min-h-[44px] snap-center flex-shrink-0 flex items-center justify-center ${
                  isActive ? "text-cream" : "text-taupe hover:text-[#2B1A17]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-menu-pill"
                    className="absolute inset-0 bg-[#2B1A17] rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* CHEF'S PICKS FEATURED ROW (3 cards, switches with category with 0.5s cross-fade) */}
        <div className="mb-14 sm:mb-16">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold-dark" />
              <h3 className="font-sans text-xs uppercase tracking-[0.25em] text-gold-dark font-semibold">
                Curated Highlights · {CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-taupe hidden sm:inline">Seasonal Reserve</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex md:grid md:grid-cols-3 gap-5 sm:gap-8 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory no-scrollbar"
            >
              {featuredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl bg-[#FAF5EE] border border-gold/40 p-4 sm:p-5 shadow-lg transition-all duration-400 hover:-translate-y-2 hover:border-gold-dark hover:shadow-[0_20px_40px_rgba(43,26,23,0.12)] flex flex-col justify-between min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-center flex-shrink-0 md:flex-shrink"
                >
                  <div>
                    {/* Card Image with Soft Gold Frame, 900px size */}
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#2B1A17]/10 border border-gold/30 mb-3.5 sm:mb-4">
                      <SafeItemImage
                        src={item.image}
                        alt={item.name}
                        priority={activeCategory === "coffee" && idx === 0}
                        sizes="(max-width: 768px) 100vw, 900px"
                        className="transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#2E0A10]/90 text-gold text-[9px] sm:text-[10px] uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full font-sans font-medium backdrop-blur-sm border border-gold/25">
                        {item.badge || "Featured"}
                      </div>
                    </div>

                    {/* Badges / Tags */}
                    <div className="flex items-center gap-2 mb-2">
                      {item.dietaryTag && (
                        <span className="text-[10px] uppercase tracking-wider text-gold-dark border border-gold-dark/40 px-2 py-0.5 rounded-full font-sans font-medium">
                          {item.dietaryTag}
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-wider text-taupe border border-taupe/30 px-2 py-0.5 rounded-full font-sans">
                        {item.notes}
                      </span>
                    </div>

                    {/* Name and Description */}
                    <h4 className="font-serif text-lg sm:text-xl text-[#2B1A17] font-medium group-hover:text-gold-dark transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="font-editorial-body text-xs sm:text-sm text-taupe mt-1 leading-relaxed font-light line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Price & Add Action (min 44px high) */}
                  <div className="mt-4 sm:mt-5 pt-3 border-t border-[#2B1A17]/10 flex items-center justify-between">
                    <span className="font-serif text-base sm:text-lg text-[#2B1A17] font-semibold">
                      {item.price}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item.name, item.price)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#2B1A17] text-cream px-4 py-2 min-h-[44px] min-w-[44px] text-xs uppercase tracking-widest font-medium hover:bg-gold-dark transition-colors shadow-sm active:scale-95 cursor-pointer justify-center"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* EDITORIAL LIST VIEW: Responsive Layout */}
        <div>
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 mb-4 pb-2 border-b border-[#2B1A17]/15">
            <span className="col-span-4 font-sans text-xs uppercase tracking-[0.2em] text-taupe font-medium">
              Items
            </span>
            <span className="col-span-6 font-sans text-xs uppercase tracking-[0.2em] text-taupe font-medium">
              Description
            </span>
            <span className="col-span-2 text-right font-sans text-xs uppercase tracking-[0.2em] text-taupe font-medium">
              Price
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="space-y-2 sm:space-y-1"
            >
              {filteredItems.map((item) => {
                const isHovered = hoveredRowItem?.id === item.id;
                const isAnotherHovered = hoveredRowItem !== null && !isHovered;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleAddToCart(item.name, item.price)}
                    className={`group relative py-3 sm:py-5 border-b border-[#2B1A17]/10 transition-opacity duration-300 cursor-pointer min-h-[44px] flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center ${
                      isAnotherHovered ? "opacity-45" : "opacity-100"
                    } hover:border-gold-dark`}
                  >
                    {/* MOBILE LAYOUT (<md): thumbnail on left, name & price on one line, description below */}
                    <div className="md:hidden flex items-center gap-3 w-full">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gold/30 bg-[#2B1A17]/10 flex-shrink-0">
                        <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-serif text-base text-[#2B1A17] font-medium truncate">
                            {item.name}
                          </h3>
                          <span className="font-serif text-base text-[#2B1A17] font-semibold flex-shrink-0">
                            {item.price}
                          </span>
                        </div>
                        <p className="text-xs text-taupe font-sans leading-relaxed font-light line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* DESKTOP LAYOUT (>=md): 12 columns */}
                    <div className="hidden md:block col-span-4 pr-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          onMouseEnter={() => setHoveredRowItem(item)}
                          onMouseLeave={() => setHoveredRowItem(null)}
                          className="font-serif text-lg lg:text-2xl text-[#2B1A17] hover:text-gold-dark transition-colors inline-block font-normal"
                        >
                          {item.name}
                        </h3>

                        {item.dietaryTag && (
                          <span className="text-[10px] uppercase tracking-wider text-gold-dark border border-gold-dark/45 px-2 py-0.5 rounded-full font-sans font-medium pointer-events-none">
                            {item.dietaryTag}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:block col-span-6 pr-4">
                      <p className="text-xs sm:text-sm text-taupe font-sans leading-relaxed font-light line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="hidden md:flex col-span-2 items-center justify-end gap-3">
                      <span className="font-serif text-base sm:text-xl text-[#2B1A17] font-semibold">
                        {item.price}
                      </span>
                      <span className="text-[11px] uppercase tracking-widest text-gold-dark opacity-0 group-hover:opacity-100 transition-opacity font-sans font-medium">
                        + Add
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
