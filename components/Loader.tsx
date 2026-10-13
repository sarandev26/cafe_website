"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSmoothScroll } from "./providers/SmoothScrollProvider";
import { preloadHeroFrames, preloadKeyFrame } from "@/lib/heroFrames";
import { heroFrameManager, chapterTwoFrameManager } from "@/lib/frameSequence";

const ABOVE_THE_FOLD_IMAGES = [
  "/hero/frame_0001.webp",
  "/chapter-two/frame_0001.webp",
  "/images/signature-latte.webp",
  "/images/signature-caramel.webp",
  "/images/craft-detail-source.webp",
  "/images/story-1.webp",
];

export function Loader() {
  const { lenis } = useSmoothScroll();
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [isRendered, setIsRendered] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const topHalfRef = useRef<HTMLDivElement>(null);
  const bottomHalfRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const titleLettersRef = useRef<HTMLSpanElement[]>([]);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const progressTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check session storage
    let alreadyVisited = false;
    try {
      if (typeof window !== "undefined") {
        alreadyVisited = Boolean(sessionStorage.getItem("aurelia_intro_shown"));
      }
    } catch {
      alreadyVisited = false;
    }

    const preloadPromise = preloadHeroFrames();
    if (typeof window !== "undefined") {
      (window as any).__preloadReady = preloadPromise;
    }

    if (alreadyVisited) {
      preloadKeyFrame(0).then(() => {
        window.dispatchEvent(new CustomEvent("hero:warmup"));
      });
      setIsDone(true);
      setIsRendered(false);
      lenis?.start();
      window.dispatchEvent(new CustomEvent("aurelia:ready"));
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 50);
      return;
    }

    // Stop Lenis while loader is active
    lenis?.stop();

    const startTime = Date.now();
    const minDisplayTime = 2200; // 2.2s minimum duration
    let progressValue = 10;
    setProgress(progressValue);

    // Initial GSAP animation setup
    const tl = gsap.timeline();

    if (lineRef.current) {
      tl.fromTo(
        lineRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 0.7, duration: 0.9, ease: "power3.inOut" }
      );
    }

    if (titleLettersRef.current.length > 0) {
      tl.fromTo(
        titleLettersRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.7, ease: "power2.out" },
        "-=0.4"
      );
    }

    if (subtitleRef.current) {
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.3"
      );
    }

    const updateProgress = (target: number) => {
      progressValue = Math.max(progressValue, target);
      setProgress(progressValue);
    };

    // Step 1: Preload fonts
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        updateProgress(20);
      });
    }

    // Step 2: Preload key above-fold images
    if (typeof window !== "undefined") {
      Promise.all(
        ABOVE_THE_FOLD_IMAGES.map((src) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.src = src;
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          });
        })
      ).then(() => {
        updateProgress(35);
      });
    }

    // Step 3: Progressive Hero WebP frames preloading (all 200 frames)
    preloadHeroFrames((percent) => {
      // Map frame loading from 35% to 98%
      const mapped = Math.round(35 + percent * 0.63);
      updateProgress(mapped);
    }).then(() => {
      updateProgress(100);
      finishLoading();
    });

    let hasFinished = false;
    const finishLoading = async () => {
      if (hasFinished) return;
      hasFinished = true;

      // Ensure fonts are loaded and initial frame windows decoded before revealing page
      if (typeof document !== "undefined" && document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }
      await heroFrameManager.decodeInitialWindow(40);
      await chapterTwoFrameManager.decodeInitialWindow(20);

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        setProgress(100);

        // Pre-warm hero canvas and call ScrollTrigger.refresh() exactly once before revealing page
        window.dispatchEvent(new CustomEvent("hero:warmup"));
        ScrollTrigger.refresh();

        setTimeout(() => {
          // Open curtain: top and bottom halves slide apart
          const exitTl = gsap.timeline({
            onComplete: () => {
              setIsDone(true);
              setIsRendered(false);
              lenis?.start();
              try {
                sessionStorage.setItem("aurelia_intro_shown", "true");
              } catch {
                // Ignore storage error
              }
              // Dispatch event to start hero video & reveals
              window.dispatchEvent(new CustomEvent("aurelia:ready"));
            },
          });

          // Fade out loader center text
          exitTl.to(
            [titleLettersRef.current, subtitleRef.current, lineRef.current, progressTextRef.current],
            {
              opacity: 0,
              y: -15,
              duration: 0.45,
              ease: "power2.in",
            }
          );

          // Curtain slide
          if (topHalfRef.current && bottomHalfRef.current) {
            exitTl.to(
              topHalfRef.current,
              {
                yPercent: -100,
                duration: 1.0,
                ease: "expo.inOut",
              },
              "-=0.2"
            );
            exitTl.to(
              bottomHalfRef.current,
              {
                yPercent: 100,
                duration: 1.0,
                ease: "expo.inOut",
              },
              "<"
            );
          }
        }, 250);
      }, remainingTime);
    };

    // Safety timeout: never block longer than 4.5s
    const maxTimer = setTimeout(finishLoading, 4500);

    return () => {
      clearTimeout(maxTimer);
      tl.kill();
    };
  }, [lenis]);

  if (!isRendered) return null;

  const brandName = "AURELIA";

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto select-none ${
        isDone ? "pointer-events-none" : ""
      }`}
      aria-live="polite"
      aria-busy={!isDone}
    >
      {/* Top half curtain */}
      <div
        ref={topHalfRef}
        className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-wine-deep via-wine to-burgundy border-b border-gold/15"
      />

      {/* Bottom half curtain */}
      <div
        ref={bottomHalfRef}
        className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-wine-deep via-wine to-burgundy border-t border-gold/15"
      />

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        {/* Central thin gold line */}
        <div
          ref={lineRef}
          className="w-[clamp(90px,28vw,192px)] h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mb-8"
        />

        {/* Title letter-by-letter - NO DOT */}
        <h1 className="font-serif text-[clamp(1.75rem,7vw,4.5rem)] font-normal text-cream tracking-[clamp(0.12em,2.2vw,0.25em)] pl-[clamp(0.12em,2.2vw,0.25em)] mb-4">
          {brandName.split("").map((letter, index) => (
            <span
              key={index}
              ref={(el) => {
                if (el) titleLettersRef.current[index] = el;
              }}
              className="inline-block"
            >
              {letter}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="font-sans text-[clamp(10px,2.5vw,14px)] tracking-[clamp(0.2em,3vw,0.3em)] uppercase text-gold/90 font-light"
        >
          COFFEE HOUSE
        </p>

        {/* Bottom percentage & progress label */}
        <div
          ref={progressTextRef}
          className="mt-12 sm:mt-16 flex flex-col items-center gap-2"
        >
          <div className="h-0.5 w-[clamp(130px,45vw,160px)] bg-wine/60 rounded-full overflow-hidden border border-gold/20">
            <div
              className="h-full bg-gold transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-3 text-xs tracking-widest text-blush/70 font-sans mt-2">
            <span>Roasting the experience…</span>
            <span className="font-mono text-gold tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
