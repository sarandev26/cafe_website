"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { heroFrameManager } from "@/lib/frameSequence";
import { SITE_CONTENT } from "@/lib/content";
import heroTimeMapData from "@/public/seq/hero/timemap.json";

const HERO_MAX_FRAME = heroFrameManager.count - 1;

function mapProgressToFrame(p: number, table: number[]): number {
  const clamped = Math.max(0, Math.min(1, p));
  const idx = clamped * (table.length - 1);
  const low = Math.floor(idx);
  const high = Math.min(table.length - 1, low + 1);
  const frac = idx - low;
  return table[low] + (table[high] - table[low]) * frac;
}

export function Hero() {
  const { scrollTo } = useSmoothScroll();
  const prefersReducedMotion = useReducedMotion();

  const heroRunwayRef = useRef<HTMLElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const headlineBlockRef = useRef<HTMLDivElement>(null);
  const ritualBlockRef = useRef<HTMLDivElement>(null);

  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastDrawnPosRef = useRef(-1);
  const lastTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const rafIdRef = useRef<number | null>(null);
  const isHeroActiveRef = useRef(true);

  // Resize canvas strictly on window resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const targetW = Math.min(2560, Math.floor(width * dpr));
    const targetH = Math.floor(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
  }, []);

  const drawFrame = useCallback(
    (framePos: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const clampedPos = Math.min(HERO_MAX_FRAME, Math.max(0, framePos));
      heroFrameManager.draw(ctx, canvas, clampedPos, 8);
    },
    []
  );

  // RequestAnimationFrame draw loop with fixed-step accumulator integrator (dt <= 1/30s, step = 1/120s)
  useEffect(() => {
    let active = true;
    lastTimeRef.current = performance.now();

    const renderLoop = () => {
      if (!active) return;

      if (isHeroActiveRef.current) {
        const now = performance.now();
        const rawDt = Math.max(0, (now - lastTimeRef.current) / 1000);
        lastTimeRef.current = now;
        // Clamp dt to at most 1/30s (33.3ms) to prevent any burst after frame drop
        const dt = Math.min(rawDt, 1 / 30);

        accumulatorRef.current += dt;
        if (accumulatorRef.current > 0.08) {
          accumulatorRef.current = 0.08;
        }

        const FIXED_STEP = 1 / 120;
        const k = 24;
        const decay = 1 - Math.exp(-FIXED_STEP * k);

        // Maximum frame velocity capped smoothly to ~1.6x normal continuous scroll velocity (~160 fps * 1.5 = 240 fps)
        const MAX_FPS = 240;
        const maxDeltaPerStep = MAX_FPS * FIXED_STEP;

        const target = targetFrameRef.current;
        let pos = smoothFrameRef.current;

        while (accumulatorRef.current >= FIXED_STEP) {
          accumulatorRef.current -= FIXED_STEP;
          let delta = (target - pos) * decay;
          if (Math.abs(delta) > maxDeltaPerStep) {
            delta = Math.sign(delta) * maxDeltaPerStep;
          }
          pos += delta;
        }

        if (Math.abs(target - pos) < 0.001) {
          pos = target;
        }

        // Fixed-step sub-frame interpolation for perfectly smooth rendering without stepping artifacts
        const alpha = Math.min(1, Math.max(0, accumulatorRef.current / FIXED_STEP));
        let nextDelta = (target - pos) * decay;
        if (Math.abs(nextDelta) > maxDeltaPerStep) {
          nextDelta = Math.sign(nextDelta) * maxDeltaPerStep;
        }
        const renderPos = pos + nextDelta * alpha;

        smoothFrameRef.current = pos;

        // Expose telemetry on window for test audit
        if (typeof window !== "undefined") {
          (window as any).__seq = (window as any).__seq || {};
          (window as any).__seq.hero = renderPos;
          (window as any).__seq.heroTarget = targetFrameRef.current;
          (window as any).__seq.heroDrawPreview = (previewCtx: CanvasRenderingContext2D, w: number, h: number) => {
            heroFrameManager.drawPreview(previewCtx, w, h, renderPos);
          };
        }

        // Redraw only when fractional position changes by more than epsilon
        if (Math.abs(renderPos - lastDrawnPosRef.current) > 0.002) {
          const frameStart = performance.now();
          drawFrame(renderPos);
          const frameDuration = performance.now() - frameStart;
          lastDrawnPosRef.current = renderPos;
          if (typeof window !== "undefined") {
            (window as any).__heroFrameTimes = (window as any).__heroFrameTimes || [];
            (window as any).__heroFrameTimes.push(frameDuration);
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [drawFrame]);

  // Window resize & warmup observer
  useEffect(() => {
    resizeCanvas();
    drawFrame(0);

    const handleResize = () => {
      resizeCanvas();
      drawFrame(smoothFrameRef.current);
    };

    const handleWarmup = () => {
      resizeCanvas();
      drawFrame(0);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("hero:warmup", handleWarmup);
    window.addEventListener("aurelia:ready", handleWarmup);
    window.addEventListener("hero:progress", handleWarmup);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("hero:warmup", handleWarmup);
      window.removeEventListener("aurelia:ready", handleWarmup);
      window.removeEventListener("hero:progress", handleWarmup);
    };
  }, [resizeCanvas, drawFrame]);

  // Main GSAP ScrollTrigger & Timeline (CSS sticky recipe, NO pin, NO pinSpacing)
  useEffect(() => {
    const runway = heroRunwayRef.current;
    const stage = heroStageRef.current;
    const headline = headlineBlockRef.current;
    const ritual = ritualBlockRef.current;

    if (!runway || !stage || !headline || !ritual) return;

    const ctx = gsap.context(() => {
      // Set initial states: transform and opacity only, always kept mounted (no display:none toggles)
      gsap.set(headline, { opacity: 1, y: 0, pointerEvents: "auto" });
      gsap.set(ritual, { opacity: 0, y: 20, pointerEvents: "none" });

      // Build Master Timeline of total duration exactly 1.0 (driven strictly by progress)
      const masterTl = gsap.timeline({ paused: true });

      // 0.00–0.12: headline holds
      // 0.12–0.22: headline fades out
      // 0.16–0.26: ritual text fades in (seamless editorial crossfade, no empty lag)
      // 0.26–0.84: ritual text holds visible
      // 0.84–0.94: ritual text fades out
      masterTl
        .to(
          headline,
          {
            opacity: 0,
            y: -24,
            duration: 0.10,
            ease: "power2.inOut",
          },
          0.12
        )
        .set(headline, { pointerEvents: "none" }, 0.22)
        .set(ritual, { pointerEvents: "auto" }, 0.16)
        .to(
          ritual,
          {
            opacity: 1,
            y: 0,
            duration: 0.10,
            ease: "power2.inOut",
          },
          0.16
        )
        .to(
          ritual,
          {
            opacity: 0,
            y: -20,
            duration: 0.10,
            ease: "power2.inOut",
          },
          0.84
        )
        .set(ritual, { pointerEvents: "none" }, 0.94)
        .set({}, {}, 1.0);

      // ScrollTrigger attached to the 420svh RUNWAY (scrub: true: exactly 1 extra smoothing layer via damping)
      ScrollTrigger.create({
        trigger: runway,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          // Motion-equalized mapping (smooth monotonic progress -> frame position)
          targetFrameRef.current = mapProgressToFrame(p, heroTimeMapData.table);
          masterTl.progress(p);
        },
        onEnter: () => {
          isHeroActiveRef.current = true;
          lastTimeRef.current = performance.now();
          accumulatorRef.current = 0;
        },
        onLeave: () => {
          isHeroActiveRef.current = false;
        },
        onEnterBack: () => {
          isHeroActiveRef.current = true;
          lastTimeRef.current = performance.now();
          accumulatorRef.current = 0;
        },
        onLeaveBack: () => {
          isHeroActiveRef.current = false;
        },
      });
    }, runway);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      data-section="hero"
      ref={heroRunwayRef}
      className="relative w-full select-none"
      style={{ height: "420svh" }}
    >
      {/* Sticky Stage: Exactly 100svh, top 0, overflow-hidden */}
      <div
        ref={heroStageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#2E0A10]"
      >
        {/* Clean full-bleed Canvas (NO heavy burgundy overlay) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover block will-change-transform"
        />

        {/* Text Presentation Layer: Fixed layout box in stage */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between pt-[var(--nav-h)] pb-6 sm:pb-12 max-[520px]:landscape:pt-14 max-[520px]:landscape:pb-2 px-6 sm:px-12 lg:px-20 pointer-events-none min-h-0 overflow-hidden">
          {/* Spacer top */}
          <div className="h-2 sm:h-4 max-[520px]:landscape:hidden" />

          {/* Centered Editorial Content Anchor: Both text blocks share this identical placement */}
          <div className="relative w-full max-w-4xl mx-auto my-auto text-center min-h-[clamp(160px,40vh,360px)] flex items-center justify-center pointer-events-auto">
            {/* 1. Headline Block (0–12% visible, 12–22% fades out) */}
            <div
              id="hero-headline-block"
              ref={headlineBlockRef}
              className="absolute inset-x-0 mx-auto text-center will-change-[transform,opacity] [transform:translateZ(0)] px-2 sm:px-4"
            >
              <h1 className="font-editorial-headline text-[clamp(1.75rem,min(8vw,8.5vh),6rem)] text-cream tracking-tight leading-[1.08] mb-3 sm:mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] max-[520px]:landscape:text-2xl max-[520px]:landscape:mb-1">
                Where every cup{" "}
                <span className="italic font-normal text-gold">becomes</span>{" "}
                an experience
              </h1>

              <p className="font-editorial-body text-blush text-xs sm:text-lg md:text-xl font-light max-w-xl mx-auto mb-4 sm:mb-8 leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-[520px]:landscape:text-xs max-[520px]:landscape:mb-2 line-clamp-2 md:line-clamp-none">
                {SITE_CONTENT.hero.subtext}
              </p>

              {/* Both CTA Buttons: Stack vertically on phones (full-width, 48px high), side-by-side from 600px or landscape */}
              <div className="flex flex-col sm:flex-row max-[520px]:landscape:flex-row items-center justify-center gap-2.5 sm:gap-6 w-full max-w-xs sm:max-w-none mx-auto">
                <MagneticButton
                  onClick={() => scrollTo("#menu")}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] max-[520px]:landscape:min-h-[36px] px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-gold text-[#1E060A] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-gold-light transition-all shadow-xl active:scale-95 cursor-pointer pointer-events-auto flex items-center justify-center text-center"
                >
                  {SITE_CONTENT.hero.ctaPrimary}
                </MagneticButton>

                <MagneticButton
                  onClick={() => scrollTo("#reserve")}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] max-[520px]:landscape:min-h-[36px] px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white text-[#1E060A] font-sans text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#FDFBF7] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all shadow-xl active:scale-95 cursor-pointer pointer-events-auto border border-white flex items-center justify-center text-center"
                >
                  {SITE_CONTENT.hero.ctaSecondary}
                </MagneticButton>
              </div>
            </div>

            {/* 2. Replacement Text Block: "Every cup, a quiet ritual." (16–26% fades in, 26–84% holds, 84–94% fades out) */}
            <div
              id="hero-replacement-block"
              ref={ritualBlockRef}
              className="absolute inset-x-0 mx-auto text-center will-change-[transform,opacity] [transform:translateZ(0)] opacity-0 pointer-events-none px-2 sm:px-4"
            >
              <h2 className="font-editorial-headline text-[clamp(1.75rem,min(8vw,8.5vh),6rem)] text-cream tracking-tight leading-[1.08] mb-3 sm:mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] max-[520px]:landscape:text-2xl max-[520px]:landscape:mb-1">
                Every cup,{" "}
                <span className="italic font-normal text-gold">a quiet</span> ritual.
              </h2>

              <p className="font-editorial-body text-blush text-xs sm:text-lg md:text-xl font-light max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] max-[520px]:landscape:text-xs">
                Single-origin beans, slow-roasted and poured with intention.
              </p>
            </div>
          </div>

          {/* Bottom Indicators: Keep ONLY small SCROLL indicator bottom-left. No lines, no 01/12 counter */}
          <div className="flex items-center justify-between text-xs font-mono text-gold/80 pointer-events-none pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-medium text-gold">
                SCROLL
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            </div>

            <div />
          </div>
        </div>
      </div>
    </section>
  );
}
