"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CountUp } from "@/components/ui/CountUp";
import { SITE_CONTENT } from "@/lib/content";
import { IMAGES } from "@/lib/images";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgImageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const stats = SITE_CONTENT.stats;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const bgImg = bgImageRef.current;
    if (!section || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Slow Parallax on moody roasted beans background
      if (bgImg) {
        gsap.fromTo(
          bgImg,
          { yPercent: -8, scale: 1.15 },
          {
            yPercent: 8,
            scale: 1.15,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );
      }

      // Staggered reveal of plain text stat items on entry
      const items = section.querySelectorAll(".stat-plain-item");
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.12,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      id="numbers"
      data-section="numbers"
      ref={sectionRef}
      className="relative w-full py-28 md:py-36 px-5 md:px-10 lg:px-16 text-cream select-none border-y border-gold/20 z-20 overflow-hidden"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      {/* Full-bleed moody background image (NO cards, NO burgundy overlay, NO blur) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div ref={bgImageRef} className="relative w-full h-[120%] -top-[10%] will-change-transform">
          <Image
            src={IMAGES.stats.bg.src}
            alt={IMAGES.stats.bg.alt}
            fill
            sizes="100vw"
            priority={false}
            className="object-cover"
          />
        </div>

        {/* Very subtle neutral dark gradient (max 20% opacity at top/bottom edges) */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="text-center mb-16 md:mb-20">
          <span className="eyebrow-badge !text-gold drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] inline-block">
            BY THE NUMBERS
          </span>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-cream font-light mt-3 drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            Composed by precision, measured in stillness.
          </h2>
        </div>

        {/* Plain text numbers in the simple style of hero stats: Big Playfair numbers, small label under each, thin gold dividers, NO cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 items-center">
          {stats.map((item, idx) => (
            <div
              key={item.label}
              className={`stat-plain-item flex flex-col items-center text-center px-4 py-6 relative ${
                idx < stats.length - 1 ? "lg:border-r border-gold/25" : ""
              } ${idx % 2 === 0 ? "border-r lg:border-r-0 border-gold/25" : ""}`}
            >
              {/* Animated big Playfair number */}
              <div className="font-editorial-headline text-5xl sm:text-6xl lg:text-7xl text-gold font-normal tracking-tight mb-2 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                <CountUp
                  end={item.value}
                  decimals={item.value % 1 !== 0 ? 1 : 0}
                  suffix={item.suffix}
                  duration={2.2}
                />
              </div>

              {/* Small label under number */}
              <span className="font-sans text-xs uppercase tracking-[0.2em] font-medium text-cream mb-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                {item.label}
              </span>

              {/* Short sub-label */}
              <p className="font-sans text-[11px] text-cream/80 font-light max-w-[20ch] leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
