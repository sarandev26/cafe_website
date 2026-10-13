"use client";

import { useRef, useState, useLayoutEffect, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SITE_CONTENT } from "@/lib/content";

export function Ingredients() {
  const sectionRef = useRef<HTMLElement>(null);
  const drinkRef = useRef<HTMLDivElement>(null);
  const bgWordRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const [activeCircleIdx, setActiveCircleIdx] = useState<number | null>(null);

  const { items, drinkHeroImage } = SITE_CONTENT.ingredients;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Subtle parallax on background word "BALANCE"
      if (bgWordRef.current) {
        gsap.fromTo(
          bgWordRef.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.5,
            },
          }
        );
      }

      // 2. Staggered reveal of satellite cards and center drink on entry
      const validCards = cardsRef.current.filter(Boolean);
      if (validCards.length > 0) {
        gsap.fromTo(
          validCards,
          { opacity: 0, scale: 0.9, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.14,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      if (drinkRef.current) {
        gsap.fromTo(
          drinkRef.current,
          { opacity: 0, scale: 0.92, y: 40 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  // Subtle mouse parallax on desktop
  useEffect(() => {
    if (prefersReducedMotion) return;
    const stage = stageRef.current;
    if (!stage) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;

      cardsRef.current.forEach((card, idx) => {
        if (!card) return;
        const multiplier = (idx % 2 === 0 ? 1 : -1) * 10;
        gsap.to(card, {
          x: relX * multiplier,
          y: relY * multiplier,
          duration: 0.8,
          ease: "power2.out",
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [prefersReducedMotion]);

  const labels = ["Origin Essence", "Texture & Body", "Slow Infusion", "Grounding Tone"];

  // Positions for the 4 desktop cards around center
  const cardPositions = [
    { pos: "top-4 left-0 lg:left-4" },
    { pos: "top-4 right-0 lg:right-4" },
    { pos: "bottom-4 left-0 lg:left-4" },
    { pos: "bottom-4 right-0 lg:right-4" },
  ];

  return (
    <section
      id="balance"
      data-section="balance"
      ref={sectionRef}
      className="relative w-full bg-[#2E0A10] py-24 md:py-32 px-5 md:px-10 lg:px-16 text-cream select-none z-20 overflow-hidden"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="eyebrow-badge !text-gold mb-3 block">
            ANATOMY OF BALANCE
          </span>
          <h2 className="font-editorial-headline text-3xl sm:text-5xl md:text-6xl text-cream tracking-tight">
            {SITE_CONTENT.ingredients.heading}{" "}
            <span className="italic font-normal text-gold">
              {SITE_CONTENT.ingredients.headingEmphasis}
            </span>
          </h2>
          <p className="font-editorial-body text-blush/80 text-sm sm:text-base mt-4 font-light leading-relaxed">
            {SITE_CONTENT.ingredients.subheading}
          </p>
        </div>

        {/* Desktop Stage: Central Drink with orbiting gold ring & floating burgundy cards */}
        <div
          ref={stageRef}
          onMouseLeave={() => setActiveCircleIdx(null)}
          className="hidden md:block relative mx-auto max-w-6xl min-h-[680px] lg:min-h-[740px]"
        >
          {/* Background word "BALANCE" horizontally & vertically centered on the center card axis */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-[86vw] max-w-7xl flex items-center justify-center opacity-[0.07] select-none"
          >
            <div ref={bgWordRef} className="w-full text-center">
              <span className="font-serif text-[clamp(5rem,13vw,14rem)] font-bold tracking-[0.16em] text-[#FAF5EE] select-none block text-center leading-none">
                BALANCE
              </span>
            </div>
          </div>
          {/* SVG Connector Lines from the 4 circles to center drink */}
          <svg className="pointer-events-none absolute inset-0 w-full h-full z-10" aria-hidden="true">
            {/* Line 0: Top-left to center */}
            <line
              x1="22%"
              y1="16%"
              x2="45%"
              y2="42%"
              stroke="#D4AF7A"
              strokeWidth={activeCircleIdx === 0 ? "2" : "1"}
              strokeDasharray="4 4"
              className="transition-all duration-500 ease-out"
              opacity={activeCircleIdx === 0 ? 0.9 : activeCircleIdx !== null ? 0.2 : 0.45}
            />
            {/* Line 1: Top-right to center */}
            <line
              x1="78%"
              y1="16%"
              x2="55%"
              y2="42%"
              stroke="#D4AF7A"
              strokeWidth={activeCircleIdx === 1 ? "2" : "1"}
              strokeDasharray="4 4"
              className="transition-all duration-500 ease-out"
              opacity={activeCircleIdx === 1 ? 0.9 : activeCircleIdx !== null ? 0.2 : 0.45}
            />
            {/* Line 2: Bottom-left to center */}
            <line
              x1="22%"
              y1="84%"
              x2="45%"
              y2="58%"
              stroke="#D4AF7A"
              strokeWidth={activeCircleIdx === 2 ? "2" : "1"}
              strokeDasharray="4 4"
              className="transition-all duration-500 ease-out"
              opacity={activeCircleIdx === 2 ? 0.9 : activeCircleIdx !== null ? 0.2 : 0.45}
            />
            {/* Line 3: Bottom-right to center */}
            <line
              x1="78%"
              y1="84%"
              x2="55%"
              y2="58%"
              stroke="#D4AF7A"
              strokeWidth={activeCircleIdx === 3 ? "2" : "1"}
              strokeDasharray="4 4"
              className="transition-all duration-500 ease-out"
              opacity={activeCircleIdx === 3 ? 0.9 : activeCircleIdx !== null ? 0.2 : 0.45}
            />
          </svg>

          {/* Orbiting thin gold SVG ring around center card */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] lg:w-[620px] h-[520px] lg:h-[620px] z-5 opacity-40">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-orbit-slow">
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#D4AF7A"
                strokeWidth="0.8"
                strokeDasharray="4 6"
              />
              <circle cx="50" cy="4" r="1.5" fill="#D4AF7A" />
              <circle cx="96" cy="50" r="1.5" fill="#D4AF7A" />
            </svg>
          </div>

          {/* Centered Hero Drink in Arch Frame */}
          <div
            ref={drinkRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-80 lg:w-[420px] max-w-[min(60vw,480px)] aspect-[3/4] rounded-t-full rounded-b-3xl overflow-hidden border border-gold/40 shadow-[0_25px_60px_rgba(20,4,8,0.7)] bg-[#1E060A] p-2.5 transition-transform duration-700 hover:scale-102"
          >
            <div className="relative w-full h-full rounded-t-full rounded-b-2xl overflow-hidden bg-[#1E060A]">
              <Image
                src={drinkHeroImage}
                alt="Aurelia composed balance drink"
                fill
                sizes="(max-width: 1024px) 380px, 480px"
                className="object-cover warm-grade transition-transform duration-1000 hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E060A]/85 via-transparent to-transparent" />
            </div>

            <div className="absolute bottom-6 inset-x-6 text-center">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-sans font-medium drop-shadow-md">
                The Aurelia Balance
              </span>
            </div>
          </div>

          {/* Four Labelled Satellite Burgundy Cards */}
          {items.map((item, idx) => {
            const isHovered = activeCircleIdx === idx;
            const isDimmed = activeCircleIdx !== null && !isHovered;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                onMouseEnter={() => setActiveCircleIdx(idx)}
                onClick={() => setActiveCircleIdx((prev) => (prev === idx ? null : idx))}
                className={`absolute ${cardPositions[idx].pos} max-w-xs cursor-pointer select-none ${
                  isHovered ? "z-50" : "z-30"
                }`}
                style={{
                  transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
                  opacity: isDimmed ? 0.55 : 1,
                  transform: isHovered ? "scale(1.08)" : "scale(1)",
                }}
              >
                <div
                  className={`group relative flex items-center gap-4 bg-[#1E060A]/90 p-4 rounded-2xl border transition-all duration-500 ${
                    isHovered
                      ? "border-gold shadow-[0_12px_36px_rgba(212,175,122,0.45)] bg-[#2E0A10]"
                      : "border-gold/30 shadow-[0_8px_24px_rgba(20,4,8,0.6)] hover:border-gold/70"
                  }`}
                >
                  {/* Circle with animated SVG ring and soft gold glow */}
                  <div className="relative h-18 w-18 rounded-full flex-shrink-0 flex items-center justify-center">
                    {/* SVG Drawn Ring on hover */}
                    <svg
                      viewBox="0 0 76 76"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <circle
                        cx="38"
                        cy="38"
                        r="34"
                        fill="none"
                        stroke="#D4AF7A"
                        strokeWidth="1.8"
                        strokeDasharray="214"
                        strokeDashoffset={isHovered ? "0" : "214"}
                        style={{
                          transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      />
                    </svg>

                    <div
                      className={`relative h-16 w-16 rounded-full overflow-hidden border border-gold/40 shadow-sm bg-[#1E060A] transition-all duration-500 ${
                        isHovered ? "shadow-[0_0_16px_rgba(212,175,122,0.7)]" : ""
                      }`}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-cover warm-grade transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Text Container */}
                  <div className="overflow-hidden">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-sans font-medium block">
                      {labels[idx]}
                    </span>
                    <h3
                      className={`font-serif text-lg font-medium transition-colors duration-300 ${
                        isHovered ? "text-gold" : "text-cream"
                      }`}
                    >
                      {item.title}
                    </h3>
                    {/* Short line reveal for description */}
                    <div className="overflow-hidden mt-1">
                      <p
                        className="font-editorial-body text-xs text-blush/80 leading-relaxed font-light line-clamp-2 transition-transform duration-500"
                        style={{
                          transform: isHovered ? "translateY(0)" : "translateY(1px)",
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile View: Center drink image with background BALANCE word, and 2x2 grid of circle cards below */}
        <div className="md:hidden mt-6 relative">
          {/* Background word "BALANCE" scaled for mobile, behind content */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-full text-center opacity-[0.07] select-none"
          >
            <span className="font-serif text-[clamp(3.5rem,15vw,6rem)] font-bold tracking-[0.16em] text-[#FAF5EE] select-none block text-center leading-none whitespace-nowrap">
              BALANCE
            </span>
          </div>

          {/* Center Drink Hero */}
          <div className="relative z-10 flex flex-col items-center justify-center mb-8">
            <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden border-2 border-gold/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] bg-[#1E060A]">
              <Image
                src={drinkHeroImage}
                alt="Aurelia Signature Drink"
                fill
                sizes="(max-width: 768px) 210px, 300px"
                className="object-cover warm-grade"
              />
            </div>
            <span className="font-serif italic text-xs text-gold/80 mt-2 block tracking-wider">
              The Golden Extraction
            </span>
          </div>

          {/* 2x2 Grid of Circle Cards */}
          <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4">
            {items.map((item, idx) => {
              const isActive = activeCircleIdx === idx;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveCircleIdx((prev) => (prev === idx ? null : idx))}
                  className={`p-3.5 sm:p-4 rounded-2xl bg-[#1E060A]/90 border transition-all duration-300 flex flex-col items-center text-center cursor-pointer select-none min-h-[44px] ${
                    isActive
                      ? "border-gold shadow-[0_8px_24px_rgba(212,175,122,0.35)] bg-[#2E0A10] scale-[1.02]"
                      : "border-gold/30 hover:border-gold/60"
                  }`}
                >
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border border-gold/40 flex-shrink-0 bg-[#1E060A] mb-2 shadow-sm">
                    <Image src={item.image} alt={item.title} fill sizes="48px" className="object-cover" />
                  </div>
                  <span className="text-[9px] uppercase tracking-widest text-gold font-sans block mb-0.5">
                    {labels[idx]}
                  </span>
                  <h3 className="font-serif text-sm sm:text-base text-cream font-medium line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="font-editorial-body text-[11px] text-blush/75 mt-1 line-clamp-2 font-light">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
