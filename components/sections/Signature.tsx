"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus, Check } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const SIGNATURE_ITEMS = [
  {
    id: "sig-latte",
    number: "01",
    name: "Aurelia Signature Latte",
    category: "Signature Extraction",
    description: "House espresso, velvet microfoam milk, infused with crushed Tahitian vanilla bean reduction.",
    price: "₹280",
    image: "/images/signature-latte.webp",
    detail: "Double ristretto · Steamed Jersey milk · 62°C",
  },
  {
    id: "sig-caramel",
    number: "02",
    name: "Iced Amber Caramel",
    category: "Cold Composition",
    description: "Slow-dripped sea salt panela caramel layered with chilled espresso and heavy cream float.",
    price: "₹310",
    image: "/images/signature-caramel.webp",
    detail: "Organic panela · Fleur de Sel · Shaken cold",
  },
  {
    id: "sig-mocha",
    number: "03",
    name: "Rouge Velvet Mocha",
    category: "Single-Estate Cocoa",
    description: "72% Ecuadorian raw Criollo dark chocolate melted into double espresso with spiced cinnamon veil.",
    price: "₹320",
    image: "/images/signature-mocha.webp",
    detail: "72% Criollo · Double ristretto · Velvet froth",
  },
  {
    id: "sig-cortado",
    number: "04",
    name: "Golden Cortado",
    category: "Equal Measures",
    description: "Dense 1:1 ratio of high-altitude ristretto and micro-steamed milk in heavy faceted crystal glass.",
    price: "₹210",
    image: "/images/signature-cortado.webp",
    detail: "1:1 ratio · Libbey glass · Brown sugar notes",
  },
  {
    id: "sig-coldbrew",
    number: "05",
    name: "Cold Brew Noir",
    category: "Cryogenic Extraction",
    description: "18-hour slow cold extraction over hand-carved ice sphere, highlighting bright bergamot and cacao.",
    price: "₹260",
    image: "/images/signature-coldbrew.webp",
    detail: "18h steep · Crystal ice sphere · Origin notes",
  },
  {
    id: "sig-brioche",
    number: "06",
    name: "Pistachio Cardamom Brioche",
    category: "Viennoiserie",
    description: "Bronte pistachio praline swirled through wild sourdough brioche knot baked fresh daily.",
    price: "₹240",
    image: "/images/signature-brioche.webp",
    detail: "Wild sourdough · Bronte pistachio · Fresh daily",
  },
];

export function Signature() {
  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [runwayHeight, setRunwayHeight] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Compute runway height: (track.scrollWidth - window.innerWidth) + window.innerHeight
  useLayoutEffect(() => {
    let lastHeight = 0;
    const updateRunwayHeight = () => {
      const track = trackRef.current;
      if (!track) return;

      const scrollDistance = Math.max(0, track.scrollWidth - window.innerWidth + 64);
      const calculatedHeight = scrollDistance + window.innerHeight;
      if (Math.abs(calculatedHeight - lastHeight) > 4) {
        lastHeight = calculatedHeight;
        setRunwayHeight(calculatedHeight);
      }
    };

    updateRunwayHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateRunwayHeight();
    });

    if (trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    window.addEventListener("resize", updateRunwayHeight, { passive: true });
    window.addEventListener("orientationchange", updateRunwayHeight, { passive: true });
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateRunwayHeight);
      window.removeEventListener("orientationchange", updateRunwayHeight);
    };
  }, []);

  // GSAP Horizontal scroll animation (CSS sticky recipe, NO pin, NO pinSpacing)
  useLayoutEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!runway || !stage || !track || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const maxScroll = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);

      const anim = gsap.to(track, {
        x: () => -maxScroll(),
        ease: "none",
        paused: true,
      });

      ScrollTrigger.create({
        trigger: runway,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          anim.progress(self.progress);
        },
      });
    }, runway);

    return () => ctx.revert();
  }, [prefersReducedMotion, runwayHeight]);

  const handleOrder = (name: string, price: string) => {
    setToast(`${name} (${price})`);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <section
      id="signature"
      data-section="signature"
      ref={runwayRef}
      className="relative w-full bg-[#2E0A10] select-none text-cream"
      style={{
        height: runwayHeight ? `${runwayHeight}px` : "220svh",
      }}
    >
      {/* Toast confirmation */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[9990] flex items-center gap-3 rounded-full bg-[#1E060A]/95 border border-gold/40 px-6 py-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center text-gold">
            <Check size={14} />
          </div>
          <p className="font-sans text-xs tracking-wider text-cream">
            Added <span className="font-semibold text-gold">{toast}</span> to your order
          </p>
        </div>
      )}

      {/* Sticky Stage: Exactly 100svh, top 0, overflow-hidden */}
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col justify-between pt-[calc(var(--nav-h,4.5rem)+0.25rem)] pb-4 sm:pb-8 px-4 sm:px-10 lg:px-16"
      >
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4 pt-1 pb-2 sm:pb-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1 sm:mb-2">
              <span className="h-px w-6 sm:w-8 bg-gold" />
              <span className="eyebrow-badge !text-gold text-[10px] sm:text-xs">
                CURATED COMPOSITION
              </span>
            </div>
            <h2 className="font-editorial-headline text-2xl sm:text-4xl lg:text-5xl text-cream tracking-tight">
              The <span className="italic font-normal text-gold">Signature</span> Collection
            </h2>
          </div>

          <p className="font-editorial-body text-blush/80 text-xs sm:text-sm max-w-md font-light leading-relaxed hidden sm:block">
            Six signature rituals composed of single-origin extractions, organic whole dairy, and house syrups.
          </p>
        </div>

        {/* Horizontal Scroll Cards Track */}
        <div className="relative w-full my-auto overflow-visible py-2 sm:py-3 min-h-0 flex items-center">
          <div
            ref={trackRef}
            className="flex items-stretch gap-4 sm:gap-6 lg:gap-8 w-max will-change-transform py-1"
          >
            {SIGNATURE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="group relative w-[clamp(260px,78vw,420px)] min-[900px]:w-[clamp(290px,25vw,390px)] rounded-2xl sm:rounded-3xl bg-[#1E060A]/90 border border-gold/30 hover:border-gold p-4 sm:p-6 flex flex-col justify-between shadow-2xl transition-all duration-400 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(20,4,8,0.9)] hover:z-30 cursor-pointer overflow-hidden flex-shrink-0"
                style={{
                  height: "clamp(260px, 58vh, 520px)",
                  maxHeight: "calc(100svh - var(--nav-h, 4.5rem) - 7rem)",
                }}
              >
                <div className="min-h-0 flex-1 flex flex-col">
                  {/* Card Image */}
                  <div className="relative w-full aspect-[16/10] sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-[#2E0A10] border border-gold/20 mb-2.5 sm:mb-4 flex-shrink-0 max-h-[42%]">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 300px, 360px"
                      className="object-cover warm-grade transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>

                  {/* Category & Title */}
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-gold font-mono block mb-0.5 sm:mb-1">
                    {item.category}
                  </span>
                  <h3 className="font-serif text-lg sm:text-2xl text-cream font-medium group-hover:text-gold transition-colors line-clamp-1 sm:line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="font-editorial-body text-xs sm:text-sm text-blush/75 mt-1 sm:mt-2 leading-relaxed font-light line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Row: Price & Order Action (always contained within card) */}
                <div className="pt-3 border-t border-gold/15 flex items-center justify-between mt-auto">
                  <div className="pr-2 min-w-0 flex-1">
                    <span className="font-serif text-xl text-cream font-semibold block leading-tight">
                      {item.price}
                    </span>
                    <span className="block text-[11px] text-blush/70 font-mono truncate mt-0.5" title={item.detail}>
                      {item.detail}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOrder(item.name, item.price)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gold text-[#1E060A] text-xs uppercase tracking-widest font-sans font-semibold hover:bg-gold-light transition-all active:scale-95 shadow-md flex-shrink-0 min-h-[44px]"
                  >
                    <Plus size={13} />
                    <span>Order</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
