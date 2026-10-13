"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SITE_CONTENT, CraftStep } from "@/lib/content";

const STEPS: CraftStep[] = SITE_CONTENT.craftSteps;

export function Craft() {
  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const mobileRailFillRef = useRef<HTMLDivElement>(null);

  // References for each step's containers and animated sub-elements
  const stepContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const specRowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageInnerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const captionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tickLabelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tickBarRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const mobileDotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    if (!runway || !stage) return;

    const ctx = gsap.context(() => {
      const stepContainers = stepContainerRefs.current.filter(Boolean) as HTMLDivElement[];
      const titles = titleRefs.current.filter(Boolean) as HTMLHeadingElement[];
      const descs = descRefs.current.filter(Boolean) as HTMLParagraphElement[];
      const specRows = specRowRefs.current.filter(Boolean) as HTMLDivElement[];
      const hints = hintRefs.current.filter(Boolean) as HTMLDivElement[];
      const imageWrappers = imageWrapperRefs.current.filter(Boolean) as HTMLDivElement[];
      const imageInners = imageInnerRefs.current.filter(Boolean) as HTMLDivElement[];
      const captions = captionRefs.current.filter(Boolean) as HTMLDivElement[];
      const tickLabels = tickLabelRefs.current.filter(Boolean) as HTMLSpanElement[];
      const tickBars = tickBarRefs.current.filter(Boolean) as HTMLSpanElement[];
      const mobileDots = mobileDotRefs.current.filter(Boolean) as HTMLDivElement[];
      const railFill = railFillRef.current;
      const mobileRailFill = mobileRailFillRef.current;

      if (stepContainers.length !== 4) return;

      // 1. Initial State at Progress = 0 (Step 0 active)
      gsap.set(stepContainers[0], { opacity: 1, visibility: "visible", display: "flex" });
      gsap.set(titles[0], { opacity: 1, y: 0 });
      gsap.set(descs[0], { opacity: 1, y: 0 });
      gsap.set(specRows[0], { opacity: 1, y: 0 });
      gsap.set(hints[0], { opacity: 1, y: 0 });
      gsap.set(captions[0], { opacity: 1, visibility: "visible" });
      gsap.set(imageWrappers[0], { clipPath: "inset(0% 0 0 0)", zIndex: 10 });
      gsap.set(imageInners[0], { scale: 1.0 });

      if (railFill) gsap.set(railFill, { height: "0%" });
      if (mobileRailFill) gsap.set(mobileRailFill, { width: "0%" });

      gsap.set(tickLabels[0], { color: "#B88E56", opacity: 1 });
      gsap.set(tickBars[0], { scaleX: 1, opacity: 1 });
      if (mobileDots[0]) gsap.set(mobileDots[0], { backgroundColor: "#B88E56", scale: 1.25 });

      // Steps 1, 2, 3 start completely hidden
      for (let i = 1; i < 4; i++) {
        gsap.set(stepContainers[i], { opacity: 0, visibility: "hidden", display: "none" });
        gsap.set(titles[i], { opacity: 0, y: 24 });
        gsap.set(descs[i], { opacity: 0, y: 24 });
        gsap.set(specRows[i], { opacity: 0, y: 20 });
        gsap.set(hints[i], { opacity: 0, y: 16 });
        gsap.set(captions[i], { opacity: 0, visibility: "hidden" });
        gsap.set(imageWrappers[i], { clipPath: "inset(100% 0 0 0)", zIndex: 10 + i });
        gsap.set(imageInners[i], { scale: 1.08 });

        gsap.set(tickLabels[i], { color: "#7A6258", opacity: 0.6 });
        gsap.set(tickBars[i], { scaleX: 0, opacity: 0 });
        if (mobileDots[i]) gsap.set(mobileDots[i], { backgroundColor: "#E2D8CC", scale: 1.0 });
      }

      if (prefersReducedMotion) {
        return;
      }

      // 2. Master Progress Timeline: duration 3.0 (snap points at 0, 1.0, 2.0, 3.0)
      const tl = gsap.timeline({ paused: true });

      for (let s = 0; s < 3; s++) {
        const segStart = s * 1.0;
        const next = s + 1;

        // (a) Outgoing text slides up and fades to opacity 0 BEFORE new text begins
        tl.to(
          [titles[s], descs[s], specRows[s], hints[s]],
          {
            y: -20,
            opacity: 0,
            duration: 0.35,
            ease: "power2.in",
          },
          segStart
        )
          .set(
            stepContainers[s],
            { visibility: "hidden", display: "none" },
            segStart + 0.35
          )

          // (b) Outgoing caption cross-fades out
          .to(
            captions[s],
            {
              opacity: 0,
              duration: 0.25,
              ease: "power1.in",
            },
            segStart + 0.1
          )
          .set(captions[s], { visibility: "hidden" }, segStart + 0.35)

          // (c) Incoming image wipes in with clip-path (inset from bottom) while scaling 1.08 -> 1.0
          .to(
            imageWrappers[next],
            {
              clipPath: "inset(0% 0 0 0)",
              duration: 0.75,
              ease: "power2.inOut",
            },
            segStart + 0.15
          )
          .to(
            imageInners[next],
            {
              scale: 1.0,
              duration: 0.75,
              ease: "power2.out",
            },
            segStart + 0.15
          )

          // (d) Incoming caption fades in
          .set(captions[next], { visibility: "visible" }, segStart + 0.45)
          .to(
            captions[next],
            {
              opacity: 1,
              duration: 0.4,
              ease: "power2.out",
            },
            segStart + 0.45
          )

          // (e) Incoming text lines slide up with 0.08s stagger; specs fade/slide in last
          .set(
            stepContainers[next],
            { display: "flex", visibility: "visible", opacity: 1 },
            segStart + 0.36
          )
          .fromTo(
            titles[next],
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.38, ease: "power2.out" },
            segStart + 0.36
          )
          .fromTo(
            descs[next],
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.38, ease: "power2.out" },
            segStart + 0.44
          )
          .fromTo(
            specRows[next],
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.38, ease: "power2.out" },
            segStart + 0.52
          )
          .fromTo(
            hints[next],
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.34, ease: "power2.out" },
            segStart + 0.60
          );

        // (f) Rail fill line animates and ticks switch
        const targetPercent = Math.round(((next) / 3) * 100);
        if (railFill) {
          tl.to(
            railFill,
            {
              height: `${targetPercent}%`,
              duration: 1.0,
              ease: "none",
            },
            segStart
          );
        }
        if (mobileRailFill) {
          tl.to(
            mobileRailFill,
            {
              width: `${targetPercent}%`,
              duration: 1.0,
              ease: "none",
            },
            segStart
          );
        }

        // Ticks transition
        tl.to(
          tickLabels[s],
          { color: "#7A6258", opacity: 0.6, duration: 0.35 },
          segStart
        )
          .to(
            tickBars[s],
            { scaleX: 0, opacity: 0, duration: 0.35 },
            segStart
          )
          .to(
            tickLabels[next],
            { color: "#B88E56", opacity: 1, duration: 0.4 },
            segStart + 0.45
          )
          .to(
            tickBars[next],
            { scaleX: 1, opacity: 1, duration: 0.4 },
            segStart + 0.45
          );

        if (mobileDots[s]) {
          tl.to(
            mobileDots[s],
            { backgroundColor: "#E2D8CC", scale: 1.0, duration: 0.35 },
            segStart
          );
        }
        if (mobileDots[next]) {
          tl.to(
            mobileDots[next],
            { backgroundColor: "#B88E56", scale: 1.25, duration: 0.4 },
            segStart + 0.45
          );
        }
      }

      // 3. ScrollTrigger with required snap configuration
      ScrollTrigger.create({
        trigger: runway,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        snap: {
          snapTo: [0, 1 / 3, 2 / 3, 1],
          duration: { min: 0.45, max: 0.9 },
          delay: 0.08,
          ease: "power2.inOut",
          directional: true,
        },
        onUpdate: (self) => {
          tl.progress(self.progress);
        },
      });
    }, runway);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      id="craft"
      data-section="craft"
      ref={runwayRef}
      className="relative w-full select-none"
      style={{ height: "400svh" }}
    >
      {/* Sticky Stage: Exactly 100svh, top 0, overflow-hidden */}
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#FDFBF7] text-[#2E0A10]"
      >
        {/* Stage Content: CSS grid with rows auto 1fr auto, fits within (100svh - nav-h) */}
        <div className="w-full h-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-14 pt-[calc(var(--nav-h,4.5rem)+0.5rem)] pb-3 sm:pb-5 md:pb-6 grid grid-rows-[auto_1fr_auto] min-h-0 overflow-hidden gap-1 sm:gap-3 md:gap-4">
          {/* ROW 1: Heading Block with Divider Line */}
          <div
            id="craft-header-block"
            className="flex-shrink-0 pt-1 pb-2.5 sm:pb-3.5 border-b border-[#2E0A10]/10 flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 sm:gap-2"
          >
            <div>
              <span className="font-sans text-[10px] sm:text-xs tracking-[0.25em] text-taupe uppercase font-semibold block mb-0.5 sm:mb-1">
                FOUR STAGES
              </span>
              <h2 className="font-serif text-[clamp(1.75rem,3.8vw,3.25rem)] text-wine-deep font-normal leading-[1.08] tracking-tight">
                The Craft of{" "}
                <i className="font-serif italic font-normal text-gold-dark">
                  Extraction
                </i>
              </h2>
            </div>
            <p className="font-sans text-xs sm:text-sm text-taupe max-w-xs font-light leading-relaxed hidden sm:block">
              Meticulous extraction parameters calibrated across four distinct stages.
            </p>
          </div>

          {/* ROW 2: Main Area (Grid / Columns with min-h-0) */}
          <div className="relative w-full h-full min-h-0 flex flex-col min-[900px]:flex-row craft-landscape-row items-center justify-between gap-3 sm:gap-6 min-[900px]:gap-10 lg:gap-14 overflow-hidden">
            {/* MOBILE ONLY (portrait): Arch Image on top (34–38svh) */}
            <div className="craft-arch-wrapper w-full min-[900px]:hidden craft-landscape-hide flex flex-col items-center justify-center flex-shrink-0 pt-10 pb-1">
              <div
                id="craft-arch-container-mobile"
                className="craft-arch-box relative rounded-t-[90px] rounded-b-[16px] overflow-visible bg-[#F5ECE0] shadow-[0_8px_24px_rgba(46,10,16,0.08)] mt-2"
                style={{
                  height: "clamp(130px, 32svh, 220px)",
                  aspectRatio: "4 / 5",
                  width: "auto",
                }}
              >
                {/* 10px outline */}
                <div
                  id="craft-offset-outline-mobile"
                  className="craft-offset-outline absolute -inset-[10px] rounded-t-[100px] rounded-b-[20px] border border-gold/40 pointer-events-none"
                  aria-hidden="true"
                />
                <div className="w-full h-full rounded-t-[90px] rounded-b-[16px] overflow-hidden relative">
                  {STEPS.map((step, idx) => (
                    <div
                      key={`mobile-img-${step.number}`}
                      className="absolute inset-0 w-full h-full overflow-hidden"
                      style={{
                        clipPath: idx === 0 ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
                        zIndex: idx === 0 ? 10 : 10 + idx,
                      }}
                    >
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        priority={idx === 0}
                        sizes="280px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MOBILE ONLY: 4 Dots Progress Rail */}
            <div className="w-full min-[900px]:hidden craft-landscape-hide flex items-center justify-between py-1 border-b border-gold/20 flex-shrink-0">
              <div className="flex items-center gap-2">
                {STEPS.map((step, idx) => (
                  <div
                    key={`dot-${step.number}`}
                    ref={(el) => {
                      mobileDotRefs.current[idx] = el;
                    }}
                    className="w-2.5 h-2.5 rounded-full transition-transform duration-300"
                    style={{
                      backgroundColor: idx === 0 ? "#B88E56" : "#E2D8CC",
                    }}
                  />
                ))}
              </div>
              <div className="relative w-24 h-[2px] bg-[#E2D8CC] rounded-full overflow-hidden">
                <div
                  ref={mobileRailFillRef}
                  className="absolute left-0 top-0 h-full bg-gold-dark rounded-full origin-left"
                  style={{ width: "0%" }}
                />
              </div>
            </div>

            {/* TEXT COLUMN (Left Column on Desktop, Flex Column centered, min-h-0) */}
            <div className="w-full min-[900px]:w-[48%] craft-landscape-col-text h-full flex flex-row items-center gap-4 sm:gap-6 lg:gap-10 min-h-0 justify-center">
              {/* Desktop Vertical Progress Rail (hidden on mobile portrait) */}
              <div className="hidden min-[900px]:flex max-[520px]:landscape:flex flex-col items-start justify-between h-[210px] lg:h-[260px] flex-shrink-0 relative pl-1">
                {/* Rail Background Line */}
                <div className="absolute left-[3px] top-0 w-[1px] h-full bg-[#E2D8CC]">
                  <div
                    ref={railFillRef}
                    className="absolute left-0 top-0 w-[2px] -ml-[0.5px] bg-gold-dark origin-top"
                    style={{ height: "0%" }}
                  />
                </div>

                {/* Four Labelled Ticks */}
                {STEPS.map((step, idx) => (
                  <div
                    key={`tick-${step.number}`}
                    className="relative flex items-center gap-3 pl-3 py-1 cursor-default"
                  >
                    <span
                      ref={(el) => {
                        tickBarRefs.current[idx] = el;
                      }}
                      className="inline-block w-2.5 h-[2px] bg-gold-dark origin-left transition-transform duration-300"
                      style={{
                        transform: idx === 0 ? "scaleX(1)" : "scaleX(0)",
                        opacity: idx === 0 ? 1 : 0,
                      }}
                    />
                    <span
                      ref={(el) => {
                        tickLabelRefs.current[idx] = el;
                      }}
                      className="font-sans text-[11px] lg:text-[13px] uppercase tracking-[0.16em] font-medium transition-colors duration-300"
                      style={{
                        color: idx === 0 ? "#B88E56" : "#7A6258",
                        opacity: idx === 0 ? 1 : 0.6,
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Step Content Area: Exactly one visible at a time */}
              <div className="flex-1 relative w-full h-full flex items-center justify-start min-h-0">
                {STEPS.map((step, idx) => (
                  <div
                    key={`step-content-${step.number}`}
                    ref={(el) => {
                      stepContainerRefs.current[idx] = el;
                    }}
                    className="absolute inset-0 w-full h-full flex flex-col justify-center min-h-0"
                    style={{
                      display: idx === 0 ? "flex" : "none",
                      visibility: idx === 0 ? "visible" : "hidden",
                      opacity: idx === 0 ? 1 : 0,
                    }}
                  >
                    {/* Step Title in Playfair: clamp(1.75rem, min(3.4vw, 6vh), 3.25rem) */}
                    <h3
                      ref={(el) => {
                        titleRefs.current[idx] = el;
                      }}
                      style={{
                        fontSize: "clamp(1.75rem, min(3.4vw, 6vh), 3.25rem)",
                        lineHeight: 1.1,
                        textWrap: "balance",
                        overflowWrap: "anywhere",
                      }}
                      className="font-serif text-wine-deep font-normal tracking-tight line-clamp-2 max-w-full md:max-w-[44ch] mb-2 sm:mb-3"
                    >
                      {step.title}
                    </h3>

                    {/* Description: clamp(15px, 1.15vw + 4px, 18px) */}
                    <p
                      ref={(el) => {
                        descRefs.current[idx] = el;
                      }}
                      style={{
                        fontSize: "clamp(15px, 1.15vw + 4px, 18px)",
                        lineHeight: 1.6,
                      }}
                      className="font-sans text-[#3D2E2B] max-w-[44ch] mb-2.5 sm:mb-4 font-light line-clamp-4 md:line-clamp-none"
                    >
                      {step.description}
                    </p>

                    {/* Spec Row: 3 compact columns */}
                    <div
                      ref={(el) => {
                        specRowRefs.current[idx] = el;
                      }}
                      className="grid grid-cols-3 border-y border-gold/30 py-2 sm:py-3 my-1 max-w-[44ch]"
                    >
                      {step.specs.map((spec, sIdx) => (
                        <div
                          key={`spec-${idx}-${spec.label}`}
                          className={`px-1.5 sm:px-3 first:pl-0 last:pr-0 ${
                            sIdx < 2 ? "border-r border-gold/30" : ""
                          }`}
                        >
                          <span className="font-sans text-[clamp(10px,1vw,12px)] uppercase tracking-wider text-taupe block mb-0.5 font-medium truncate">
                            {spec.label}
                          </span>
                          <span
                            style={{ fontSize: "clamp(18px, 1.6vw, 24px)" }}
                            className="font-serif text-wine-deep font-normal leading-tight block truncate"
                          >
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DESKTOP / LANDSCAPE RIGHT COLUMN: Arch Image with guaranteed >=32px clearance */}
            <div
              id="craft-image-column"
              className="craft-arch-wrapper hidden min-[900px]:flex craft-landscape-col-half relative w-[48%] h-full flex-col items-center justify-center min-h-0 pt-8 sm:pt-10 pb-6 sm:pb-8 flex-shrink-0"
            >
              {/* Arch container with 10px offset outline and >=32px clear space from divider */}
              <div
                id="craft-arch-container"
                className="craft-arch-box relative rounded-t-[130px] md:rounded-t-[180px] lg:rounded-t-[210px] rounded-b-[20px] overflow-visible bg-[#F5ECE0] shadow-[0_12px_36px_rgba(46,10,16,0.08)] mt-2"
                style={{
                  height: "100%",
                  maxHeight: "min(58vh, 520px)",
                  aspectRatio: "4 / 5",
                  width: "auto",
                }}
              >
                {/* 10px Offset Outline Frame */}
                <div
                  id="craft-offset-outline"
                  className="craft-offset-outline absolute -inset-[10px] rounded-t-[140px] md:rounded-t-[190px] lg:rounded-t-[220px] rounded-b-[24px] border border-gold/40 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Inner Arch Frame: Clean image area */}
                <div className="w-full h-full rounded-t-[130px] md:rounded-t-[180px] lg:rounded-t-[210px] rounded-b-[20px] overflow-hidden relative">
                  {STEPS.map((step, idx) => (
                    <div
                      key={`img-wrap-${step.number}`}
                      ref={(el) => {
                        imageWrapperRefs.current[idx] = el;
                      }}
                      className="absolute inset-0 w-full h-full overflow-hidden"
                      style={{
                        clipPath: idx === 0 ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)",
                        zIndex: idx === 0 ? 10 : 10 + idx,
                      }}
                    >
                      <div
                        ref={(el) => {
                          imageInnerRefs.current[idx] = el;
                        }}
                        className="relative w-full h-full origin-center"
                        style={{
                          transform: idx === 0 ? "scale(1.0)" : "scale(1.08)",
                        }}
                      >
                        <Image
                          src={step.image}
                          alt={step.title}
                          fill
                          priority={idx === 0}
                          sizes="(max-width: 768px) 85vw, 45vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tiny Caption below Image */}
              <div className="relative w-full mt-2 sm:mt-2.5 h-4 flex items-center justify-center">
                {STEPS.map((step, idx) => (
                  <p
                    key={`caption-${step.number}`}
                    ref={(el) => {
                      captionRefs.current[idx] = el;
                    }}
                    className="absolute font-sans text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-taupe font-medium text-center"
                    style={{
                      opacity: idx === 0 ? 1 : 0,
                      visibility: idx === 0 ? "visible" : "hidden",
                    }}
                  >
                    {step.caption}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: Hint Line (Hidden only on short landscape phones <520px) */}
          <div
            id="craft-hint-row"
            className="flex-shrink-0 pt-1 pb-1 flex items-center justify-between text-gold-dark craft-landscape-hide"
          >
            <div className="relative w-full h-5 flex items-center">
              {STEPS.map((step, idx) => {
                const nextStepName =
                  idx < STEPS.length - 1 ? STEPS[idx + 1].label : null;

                return (
                  <div
                    key={`hint-${step.number}`}
                    ref={(el) => {
                      hintRefs.current[idx] = el;
                    }}
                    className="absolute inset-x-0 font-sans text-[11px] sm:text-[12px] tracking-[0.2em] uppercase font-semibold flex items-center gap-1.5"
                    style={{
                      display: idx === 0 ? "flex" : "none",
                      visibility: idx === 0 ? "visible" : "hidden",
                      opacity: idx === 0 ? 1 : 0,
                    }}
                  >
                    {nextStepName ? (
                      <span>Next: {nextStepName} →</span>
                    ) : (
                      <span>Continue ↓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
