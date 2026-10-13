"use client";

import { useRef, useLayoutEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface CountUpProps {
  end: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({
  end,
  decimals = 0,
  duration = 2.0,
  suffix = "",
  prefix = "",
  className = "",
}: CountUpProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(end);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (prefersReducedMotion) {
      setDisplayValue(end);
      return;
    }

    const counter = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(counter, {
        val: end,
        duration,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          setDisplayValue(
            decimals > 0
              ? Number(counter.val.toFixed(decimals))
              : Math.floor(counter.val)
          );
        },
      });
    }, el);

    return () => ctx.revert();
  }, [decimals, duration, end, prefersReducedMotion]);

  const formatted =
    decimals > 0 ? displayValue.toFixed(decimals) : displayValue.toString();

  return (
    <span ref={containerRef} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
