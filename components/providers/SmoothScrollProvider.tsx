"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: Record<string, unknown>) => void;
  stop: () => void;
  start: () => void;
  isReady: boolean;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
  isReady: false,
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

// Register GSAP plugins on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  try {
    if (SplitText) {
      gsap.registerPlugin(SplitText);
    }
  } catch {
    // SplitText graceful register
  }
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const [isReady, setIsReady] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Configure ScrollTrigger globally for optimal performance
    ScrollTrigger.config({
      limitCallbacks: true,
      ignoreMobileResize: true,
    });

    // Initialize Lenis smooth scroll with specified configuration
    const lenis = new Lenis({
      lerp: 0.075,
      smoothWheel: true,
      wheelMultiplier: 0.8,
      syncTouch: false,
      autoRaf: false,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);
    if (typeof window !== "undefined") {
      (window as any).lenis = lenis;
      (window as any).__lenisCount = ((window as any).__lenisCount || 0) + 1;
      (window as any).__lenisDrivers = 1;
      (window as any).__lenisConfig = {
        lerp: 0.075,
        wheelMultiplier: 0.8,
        hasDuration: false,
        hasEasing: false,
      };
    }

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    setIsReady(true);

    // Handle debounced window resize refresh
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== "undefined") {
        (window as any).__lenisCount = Math.max(0, ((window as any).__lenisCount || 1) - 1);
      }
    };
  }, []);

  const scrollTo = (target: string | number | HTMLElement, options?: Record<string, unknown>) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: 0,
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options,
      });
    } else if (typeof window !== "undefined" && typeof target === "string" && target.startsWith("#")) {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const stop = () => {
    lenisRef.current?.stop();
  };

  const start = () => {
    lenisRef.current?.start();
  };

  return (
    <SmoothScrollContext.Provider
      value={{
        lenis: lenisInstance,
        scrollTo,
        stop,
        start,
        isReady,
      }}
    >
      {children}
    </SmoothScrollContext.Provider>
  );
}
