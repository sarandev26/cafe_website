"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const [cursorLabel, setCursorLabel] = useState<string>("");
  const [cursorState, setCursorState] = useState<"default" | "hover" | "view" | "hidden">("default");
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Only show on desktop with fine mouse pointer
    if (
      typeof window === "undefined" ||
      prefersReducedMotion ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    setIsVisible(true);

    const xDotTo = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
    const yDotTo = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
    const xRingTo = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power2.out" });
    const yRingTo = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      xDotTo(e.clientX);
      yDotTo(e.clientY);
      xRingTo(e.clientX);
      yRingTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Inputs and textareas
      if (target.closest("input, textarea, select")) {
        setCursorState("hidden");
        setCursorLabel("");
        return;
      }

      // Check specific cursor attributes
      const customCursor = target.closest("[data-cursor]")?.getAttribute("data-cursor");
      if (customCursor === "view") {
        setCursorState("view");
        setCursorLabel("View");
        return;
      }

      if (customCursor === "order") {
        setCursorState("hover");
        setCursorLabel("Order");
        return;
      }

      // Buttons and clickable links
      if (target.closest("button, a, [role='button']")) {
        setCursorState("hover");
        const btnText = target.closest("button")?.textContent?.toLowerCase();
        if (btnText?.includes("order") || btnText?.includes("cart")) {
          setCursorLabel("Order");
        } else {
          setCursorLabel("Open");
        }
        return;
      }

      // Default
      setCursorState("default");
      setCursorLabel("");
    };

    const handleMouseDown = () => {
      if (ring) gsap.to(ring, { scale: 0.85, duration: 0.2 });
    };

    const handleMouseUp = () => {
      if (ring) gsap.to(ring, { scale: 1, duration: 0.25 });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [prefersReducedMotion]);

  if (!isVisible || prefersReducedMotion) return null;

  const isHidden = cursorState === "hidden";
  const isView = cursorState === "view";
  const isHover = cursorState === "hover";

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {/* Central Gold Dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -ml-1 -mt-1 h-2 w-2 rounded-full bg-gold transition-opacity duration-300 ${
          isHidden || isView ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Trailing Ring */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 flex items-center justify-center rounded-full transition-all duration-300 ${
          isHidden ? "opacity-0 scale-50" : "opacity-100"
        } ${
          isView
            ? "-ml-8 -mt-8 h-16 w-16 bg-wine/80 border border-gold/70 backdrop-blur-sm shadow-[0_0_20px_rgba(212,175,122,0.3)]"
            : isHover
            ? "-ml-6 -mt-6 h-12 w-12 bg-gold/20 border border-gold backdrop-blur-xs"
            : "-ml-4 -mt-4 h-8 w-8 border border-gold/45"
        }`}
      >
        {cursorLabel && (
          <span
            ref={textRef}
            className="text-[9px] uppercase tracking-[0.2em] font-sans font-medium text-gold select-none"
          >
            {cursorLabel}
          </span>
        )}
      </div>
    </div>
  );
}
