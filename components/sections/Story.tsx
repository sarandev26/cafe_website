"use client";

import { useRef, useLayoutEffect, useState, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SITE_CONTENT } from "@/lib/content";
import { IMAGES } from "@/lib/images";

export function Story() {
  const sectionRef = useRef<HTMLElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const hairlineRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const subImageRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<HTMLSpanElement>(null);

  const prefersReducedMotion = useReducedMotion();

  const [typedChars, setTypedChars] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);

  const fullHeadingText = "We believe coffee deserves patience.";

  // Typewriter effect on entry (one-time, blinking gold cursor that stops after finishing)
  useEffect(() => {
    if (prefersReducedMotion) {
      setTypedChars(fullHeadingText);
      setIsTypingDone(true);
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    let hasStarted = false;
    let timer: NodeJS.Timeout;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top 80%",
      once: true,
      onEnter: () => {
        if (hasStarted) return;
        hasStarted = true;

        let charIdx = 0;
        timer = setInterval(() => {
          if (charIdx <= fullHeadingText.length) {
            setTypedChars(fullHeadingText.slice(0, charIdx));
            charIdx++;
          } else {
            clearInterval(timer);
            setIsTypingDone(true);
          }
        }, 40);
      },
    });

    return () => {
      trigger.kill();
      clearInterval(timer);
    };
  }, [prefersReducedMotion]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const textContainer = textContainerRef.current;
    const hairline = hairlineRef.current;
    const mainImg = mainImageRef.current;
    const subImg = subImageRef.current;
    if (!section || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const lines = textContainer?.querySelectorAll(".story-line-reveal");

      // 1. SET INITIAL HIDDEN STATES WITH GSAP.SET INSIDE CONTEXT BEFORE TRIGGER
      if (hairline) gsap.set(hairline, { scaleY: 0, transformOrigin: "top center" });
      if (lines && lines.length > 0) gsap.set(lines, { yPercent: 100, opacity: 0 });
      if (mainImg) gsap.set(mainImg, { clipPath: "inset(100% 0% 0% 0% round 16px)" });
      if (subImg) gsap.set(subImg, { clipPath: "inset(0% 0% 100% 0% round 12px)" });

      // 2. TRIGGER ENTRY ANIMATIONS ON SCROLL (start: "top 80%", once: true)
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        once: true,
        onEnter: () => {
          // Draw gold hairline
          if (hairline) {
            gsap.to(hairline, {
              scaleY: 1,
              duration: 1.2,
              ease: "power2.out",
            });
          }

          // Paragraph line-by-line mask reveal
          if (lines && lines.length > 0) {
            gsap.to(lines, {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              stagger: 0.16,
              ease: "power3.out",
            });
          }

          // Images with clip-path wipe on entry
          if (mainImg) {
            gsap.to(mainImg, {
              clipPath: "inset(0% 0% 0% 0% round 16px)",
              duration: 1.2,
              ease: "power3.out",
            });
          }

          if (subImg) {
            gsap.to(subImg, {
              clipPath: "inset(0% 0% 0% 0% round 12px)",
              duration: 1.3,
              delay: 0.2,
              ease: "power3.out",
            });
          }
        },
      });

      // 3. Parallax scrub on images
      if (mainImg) {
        gsap.fromTo(
          mainImg,
          { y: 35 },
          {
            y: -35,
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

      if (subImg) {
        gsap.fromTo(
          subImg,
          { y: -20 },
          {
            y: 45,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.6,
            },
          }
        );
      }
    }, section);

    // Refresh triggers after layout render
    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      id="story"
      data-section="story"
      ref={sectionRef}
      className="relative w-full bg-[#FAF5EE] py-24 sm:py-32 px-6 sm:px-12 lg:px-20 text-[#2B1A17] overflow-hidden select-none z-20"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      {/* Floating subtle decorative elements */}
      <div className="absolute top-16 right-[12%] pointer-events-none w-28 h-28 rounded-full border border-gold-dark/25 opacity-40 animate-pulse" />
      <div className="absolute bottom-20 left-[8%] pointer-events-none flex gap-2 opacity-30">
        <span className="w-1.5 h-1.5 rounded-full bg-gold-dark" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-dark" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-dark" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Main 2-Column Editorial Grid */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-10 min-[900px]:gap-16 items-center">
          {/* Left Column: Heading with Typewriter effect, Line-by-line Mask Reveal, Paragraph */}
          <div className="min-[900px]:col-span-7 flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-gold-dark" />
              <span className="eyebrow-badge !text-taupe">
                {SITE_CONTENT.story.eyebrow}
              </span>
            </div>

            {/* Typewriter Heading */}
            <h2 className="font-editorial-headline text-[#2B1A17] text-[clamp(2rem,4.5vw,4.25rem)] tracking-tight leading-[1.08] mb-6 sm:mb-8 min-h-[1.2em] break-words [overflow-wrap:anywhere]">
              <span ref={typewriterRef}>{typedChars}</span>
              {!isTypingDone && (
                <span className="inline-block w-1.5 h-[0.9em] bg-gold ml-1 animate-pulse align-middle" />
              )}
            </h2>

            {/* Hairline + Line-by-line Mask Reveal Paragraph */}
            <div className="relative flex gap-5 sm:gap-7 my-2">
              <div
                ref={hairlineRef}
                className="w-[2px] bg-gold flex-shrink-0 rounded-full"
                aria-hidden="true"
              />

              <div ref={textContainerRef} className="py-1">
                {/* Paragraph with line-by-line mask reveal */}
                <div className="space-y-2 font-serif text-xl sm:text-2xl md:text-3xl leading-snug tracking-tight text-[#2B1A17]">
                  <div className="overflow-hidden">
                    <p className="story-line-reveal will-change-transform">
                      Aurelia began with a simple idea: slow down.
                    </p>
                  </div>
                  <div className="overflow-hidden">
                    <p className="story-line-reveal will-change-transform">
                      We work directly with small origin farms,
                    </p>
                  </div>
                  <div className="overflow-hidden">
                    <p className="story-line-reveal will-change-transform">
                      roast every batch in-house, and serve each cup
                    </p>
                  </div>
                  <div className="overflow-hidden">
                    <p className="story-line-reveal will-change-transform">
                      as if it were the only one.
                    </p>
                  </div>
                </div>

                {/* Short second paragraph */}
                <div className="overflow-hidden mt-6">
                  <p className="story-line-reveal font-editorial-body text-taupe text-sm sm:text-base leading-relaxed font-light max-w-xl will-change-transform">
                    {SITE_CONTENT.story.secondParagraph}
                  </p>
                </div>

                {/* Founder signature line */}
                <div className="mt-8 pt-5 border-t border-[#2B1A17]/15 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-gold-dark" />
                  <p className="font-serif italic text-xs sm:text-sm text-[#2B1A17]/80 tracking-wide">
                    {SITE_CONTENT.story.founderSignature}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fixed Images with Clip-Path Wipe, Parallax, and Ken Burns Zoom + Rotating Badge */}
          <div className="min-[900px]:col-span-5 relative flex justify-center min-[900px]:justify-end mt-4 min-[900px]:mt-0">
            <div className="relative w-full max-w-md">
              {/* Tall Main Image with very slow Ken Burns zoom (1.0 -> 1.06) */}
              <div
                ref={mainImageRef}
                className="relative w-[75%] sm:w-[80%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-[#2B1A17]/15 bg-[#2B1A17]/10 ml-auto will-change-transform"
              >
                <div className="relative w-full h-full animate-ken-burns">
                  <Image
                    src={IMAGES.story.farm.src}
                    alt={IMAGES.story.farm.alt}
                    fill
                    sizes="(max-width: 768px) 300px, 450px"
                    className="object-cover warm-grade"
                  />
                </div>
                <div className="absolute inset-0 ring-1 ring-inset ring-[#2B1A17]/15 rounded-2xl pointer-events-none" />
              </div>

              {/* Smaller Overlapping Image (FIXED, NO slideshow/crossfade) */}
              <div
                ref={subImageRef}
                className="absolute -bottom-6 -left-2 sm:-left-6 w-[55%] aspect-[4/5] rounded-xl overflow-hidden shadow-2xl border-2 border-gold/70 bg-[#2B1A17]/20 z-10 will-change-transform"
              >
                <div className="relative w-full h-full animate-ken-burns-sub">
                  <Image
                    src={IMAGES.story.interior.src}
                    alt={IMAGES.story.interior.alt}
                    fill
                    sizes="(max-width: 768px) 200px, 300px"
                    className="object-cover warm-grade"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2B1A17]/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Circular Rotating Gold Text Badge */}
              <div
                className="absolute -top-3 -left-2 sm:-top-4 sm:-left-4 z-20 h-18 w-18 sm:h-24 sm:w-24 md:h-28 md:w-28 rounded-full bg-[#2E0A10] border border-gold/50 shadow-2xl flex items-center justify-center p-1 sm:p-2"
                style={{
                  animation: "spin 24s linear infinite",
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full fill-gold text-[8.5px] uppercase tracking-[0.24em] font-sans font-medium"
                >
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                    fill="none"
                  />
                  <text>
                    <textPath href="#circlePath">
                      SLOW ROASTED · SMALL BATCH ·
                    </textPath>
                  </text>
                </svg>
                <div className="absolute h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes kenBurnsSlow {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes kenBurnsSubSlow {
          0% {
            transform: scale(1.06);
          }
          50% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.06);
          }
        }
        .animate-ken-burns {
          animation: kenBurnsSlow 20s ease-in-out infinite alternate;
        }
        .animate-ken-burns-sub {
          animation: kenBurnsSubSlow 22s ease-in-out infinite alternate;
        }
      `}</style>
    </section>
  );
}
