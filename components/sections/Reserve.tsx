"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Phone } from "lucide-react";
import { IMAGES } from "@/lib/images";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Reserve() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        content,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      id="reserve"
      data-section="reserve"
      ref={sectionRef}
      className="relative w-full min-h-[540px] lg:min-h-[640px] lg:max-h-[800px] bg-[#1E060A] text-cream select-none overflow-hidden z-20 border-t border-gold/15"
    >
      {/* Full-width Split Layout: Left photo (42svh on mobile), Right cream panel */}
      <div
        ref={contentRef}
        className="w-full h-full flex flex-col min-[900px]:flex-row items-stretch"
      >
        {/* Left Half: Photo (42svh on mobile) */}
        <div className="relative w-full min-[900px]:w-1/2 h-[42svh] min-h-[260px] min-[900px]:h-auto min-[900px]:min-h-[580px] overflow-hidden flex-shrink-0">
          <Image
            src={IMAGES.reserve.photo.src}
            alt={IMAGES.reserve.photo.alt}
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            priority={false}
            className="object-cover warm-grade"
          />

          {/* Light neutral dark gradient behind the title for contrast */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Title "RESERVE" in lower-left over photo */}
          <div className="absolute bottom-5 left-5 sm:bottom-10 sm:left-10 lg:bottom-12 lg:left-12 z-10">
            <span className="font-editorial-headline text-3xl sm:text-5xl lg:text-6xl text-cream font-normal tracking-[0.08em] drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              RESERVE
            </span>
          </div>
        </div>

        {/* Right Half: Full-height cream panel */}
        <div className="w-full min-[900px]:w-1/2 bg-cream text-espresso p-6 sm:p-10 lg:p-16 flex flex-col justify-center">
          <span className="eyebrow-badge !text-taupe mb-2.5 block">
            RESERVATIONS
          </span>

          <h2 className="font-editorial-headline text-2xl sm:text-4xl lg:text-5xl text-espresso tracking-tight mb-2.5 sm:mb-3">
            Reserve your table
          </h2>

          <p className="font-editorial-body text-taupe text-sm sm:text-base font-light leading-relaxed mb-5 sm:mb-6 max-w-md">
            Call us and our hosts will prepare a warm table for your ritual.
          </p>

          {/* Direct Line Phone Number */}
          <div className="mb-3">
            <span className="text-[10px] uppercase tracking-widest text-gold-dark font-mono block mb-1">
              Direct Line
            </span>
            <a
              href="tel:+919876543210"
              className="font-serif text-2xl sm:text-3xl lg:text-4xl text-espresso font-semibold hover:text-gold-dark transition-colors block w-full py-1.5 tracking-tight min-h-[44px]"
            >
              +91 98765 43210
            </a>
          </div>

          {/* Small opening hours */}
          <p className="font-sans text-xs text-taupe mb-5 sm:mb-6">
            Reservations accepted daily · 8:00 AM — 11:00 PM IST
          </p>

          {/* Refined "Call to Book" button (full width on mobile, 48px high) */}
          <div className="w-full">
            <a
              href="tel:+919876543210"
              className="w-full min-[900px]:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-gold text-[#1E060A] font-sans text-xs uppercase tracking-[0.18em] font-semibold hover:bg-gold-light transition-all active:scale-95 shadow-md cursor-pointer min-h-[48px]"
            >
              <Phone size={14} />
              <span>Call to Book</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
