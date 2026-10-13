"use client";

import { useRef, useState, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SITE_CONTENT } from "@/lib/content";

export function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Pick 6 cards for expanding gallery; FIRST (left-most) card "Morning Pour" open by default
  const galleryItems = SITE_CONTENT.gallery.slice(0, 6);
  const [activeIdx, setActiveIdx] = useState(0);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const cards = container.querySelectorAll(".gallery-expanding-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: "top 80%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      id="moments"
      data-section="moments"
      ref={sectionRef}
      className="relative w-full bg-[#2E0A10] py-24 md:py-32 px-5 md:px-10 lg:px-16 text-cream select-none overflow-hidden z-20"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <span className="eyebrow-badge mb-3 block text-gold/90">
            VISUAL CHRONICLE
          </span>
          <h2 className="font-editorial-headline text-3xl sm:text-5xl md:text-6xl text-cream tracking-tight">
            Moments at{" "}
            <span className="italic font-normal text-gold">Aurelia</span>
          </h2>
          <p className="font-editorial-body text-blush/80 text-sm sm:text-base mt-4 font-light">
            An intimate glimpse into our morning extractions, artisan viennoiserie, and daylight sanctuary.
          </p>
        </div>

        {/* Expanding Card Gallery: Single horizontal row of 6 tall cards (NO white/ivory border or stroke, NO numbers) */}
        <div
          ref={containerRef}
          onMouseLeave={() => setActiveIdx(0)}
          className="relative w-full h-[65vh] sm:h-[70vh] flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto md:overflow-hidden snap-x snap-mandatory no-scrollbar"
        >
          {galleryItems.map((item, idx) => {
            const isActive = activeIdx === idx;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => setActiveIdx(idx)}
                tabIndex={0}
                onFocus={() => setActiveIdx(idx)}
                className={`gallery-expanding-card group relative h-full rounded-[20px] sm:rounded-[24px] overflow-hidden bg-[#1E060A] cursor-pointer snap-center select-none flex-shrink-0 md:flex-shrink ${
                  isActive
                    ? "w-[75vw] sm:w-[65vw] md:w-auto flex-[4.5] shadow-[0_20px_50px_rgba(20,4,8,0.9)]"
                    : "w-[72px] sm:w-[90px] md:w-auto flex-1 opacity-75 hover:opacity-100"
                }`}
                style={{
                  transition: "flex 0.6s cubic-bezier(0.22, 1, 0.36, 1), width 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease",
                }}
                data-cursor="view"
                aria-label={item.title}
              >
                {/* Image without stroke/border */}
                <div className="relative w-full h-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 300px, 600px"
                    className="object-cover warm-grade transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E060A]/90 via-[#1E060A]/20 to-transparent opacity-80" />
                </div>

                {/* Overlaid Label / Content */}
                <div
                  className={`absolute inset-x-0 bottom-0 p-5 sm:p-6 text-cream transition-all duration-500 flex flex-col justify-end ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-mono block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-cream font-medium">
                    {item.title}
                  </h3>
                  <p className="font-editorial-body text-xs text-blush/80 mt-1 line-clamp-2 max-w-md font-light">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
