"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { chapterTwoFrameManager } from "@/lib/frameSequence";
import chapterTwoTimeMapData from "@/public/seq/chapter-two/timemap.json";

const C2_MAX_FRAME = chapterTwoFrameManager.count - 1;

function mapProgressToFrame(p: number, table: number[]): number {
  const clamped = Math.max(0, Math.min(1, p));
  const idx = clamped * (table.length - 1);
  const low = Math.floor(idx);
  const high = Math.min(table.length - 1, low + 1);
  const frac = idx - low;
  return table[low] + (table[high] - table[low]) * frac;
}

export function Interlude() {
  const prefersReducedMotion = useReducedMotion();

  const runwayRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const text1Ref = useRef<HTMLDivElement>(null);
  const text2Ref = useRef<HTMLDivElement>(null);

  const targetFrameRef = useRef(0);
  const smoothFrameRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastDrawnPosRef = useRef(-1);
  const lastTimeRef = useRef(typeof performance !== "undefined" ? performance.now() : 0);
  const rafIdRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);

  // Resize canvas to full viewport
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

      const clampedPos = Math.min(C2_MAX_FRAME, Math.max(0, framePos));
      chapterTwoFrameManager.draw(ctx, canvas, clampedPos, 12);
    },
    []
  );

  // RequestAnimationFrame draw loop with fixed-step accumulator integrator (dt <= 1/30s, step = 1/120s)
  useEffect(() => {
    let active = true;
    lastTimeRef.current = performance.now();

    const renderLoop = () => {
      if (!active) return;

      if (isActiveRef.current) {
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
          (window as any).__seq.chapter = renderPos;
          (window as any).__seq.chapterTarget = targetFrameRef.current;
          (window as any).__seq.chapterDrawPreview = (previewCtx: CanvasRenderingContext2D, w: number, h: number) => {
            chapterTwoFrameManager.drawPreview(previewCtx, w, h, renderPos);
          };
        }

        // Redraw only when fractional position changes by more than epsilon
        if (Math.abs(renderPos - lastDrawnPosRef.current) > 0.002) {
          const frameStart = performance.now();
          drawFrame(renderPos);
          const frameDuration = performance.now() - frameStart;
          lastDrawnPosRef.current = renderPos;
          if (typeof window !== "undefined") {
            (window as any).__chapterFrameTimes = (window as any).__chapterFrameTimes || [];
            (window as any).__chapterFrameTimes.push(frameDuration);
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

  // Initial draw, resize & warmup
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

  // Master GSAP ScrollTrigger for Chapter Two (CSS sticky, NO pin, NO pinSpacing)
  useEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const text1 = text1Ref.current;
    const text2 = text2Ref.current;

    if (!runway || !stage || !text1 || !text2) return;

    const ctx = gsap.context(() => {
      // Set initial states: transform and opacity only, kept mounted at all times (no display:none toggles)
      gsap.set(text1, { opacity: 1, y: 0 });
      gsap.set(text2, { opacity: 0, y: 16 });

      // Build Master Timeline (0 to 1.0 progress)
      const tl = gsap.timeline({ paused: true });

      // 0.00–0.42: Text 1 ("Crafted slowly.") holds
      // 0.42–0.52: Text 1 fades out
      // 0.46–0.56: Text 2 ("Poured perfectly.") fades in (smooth overlapping crossfade, no empty gap)
      // 0.56–0.88: Text 2 holds
      // 0.88–0.96: Text 2 fades out
      tl.to(
        text1,
        {
          opacity: 0,
          y: -16,
          duration: 0.10,
          ease: "power2.inOut",
        },
        0.42
      )
        .to(
          text2,
          {
            opacity: 1,
            y: 0,
            duration: 0.10,
            ease: "power2.out",
          },
          0.46
        )
        .to(
          text2,
          {
            opacity: 0,
            y: -16,
            duration: 0.08,
            ease: "power2.in",
          },
          0.88
        )
        .set({}, {}, 1.0);

      ScrollTrigger.create({
        trigger: runway,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          // Motion-equalized mapping (smooth monotonic progress -> frame position)
          targetFrameRef.current = mapProgressToFrame(p, chapterTwoTimeMapData.table);
          tl.progress(p);
        },
        onEnter: () => {
          isActiveRef.current = true;
          lastTimeRef.current = performance.now();
          accumulatorRef.current = 0;
        },
        onLeave: () => {
          isActiveRef.current = false;
        },
        onEnterBack: () => {
          isActiveRef.current = true;
          lastTimeRef.current = performance.now();
          accumulatorRef.current = 0;
        },
        onLeaveBack: () => {
          isActiveRef.current = false;
        },
      });
    }, runway);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="chapter-two"
      data-section="chapter-two"
      ref={runwayRef}
      className="relative w-full select-none"
      style={{ height: "380svh" }}
    >
      {/* Sticky Stage: Exactly 100svh, top 0, overflow-hidden */}
      <div
        ref={stageRef}
        className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#2E0A10]"
      >
        {/* Full Edge-to-Edge Canvas: 100vw × 100svh, no border, no outline */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover block will-change-transform"
        />

        {/* Left-Aligned Bottom-Left Text Column (clear of navbar & safe-area insets) */}
        <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+2.5rem)] sm:bottom-20 left-5 sm:left-12 lg:left-20 z-20 max-w-lg pointer-events-none">
          {/* Text 1: 0–42% "Crafted slowly." */}
          <div
            id="chapter-crafted"
            ref={text1Ref}
            className="will-change-[transform,opacity] [transform:translateZ(0)]"
          >
            <span className="eyebrow-badge !text-gold mb-2 block tracking-[0.28em] text-[10px] sm:text-xs">
              CHAPTER TWO · EXTRACTION
            </span>
            <h2 className="font-editorial-headline text-[clamp(2.25rem,6vw,4.5rem)] text-cream tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              Crafted <span className="italic font-normal text-gold">slowly.</span>
            </h2>
          </div>

          {/* Text 2: 46–88% "Poured perfectly." */}
          <div
            id="chapter-poured"
            ref={text2Ref}
            className="will-change-[transform,opacity] [transform:translateZ(0)] opacity-0"
          >
            <span className="eyebrow-badge !text-gold mb-2 block tracking-[0.28em] text-[10px] sm:text-xs">
              CHAPTER TWO · EXTRACTION
            </span>
            <h2 className="font-editorial-headline text-[clamp(2.25rem,6vw,4.5rem)] text-cream tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
              Poured <span className="italic font-normal text-gold">perfectly.</span>
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
