"use client";

import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SplitRevealProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  type?: "words" | "chars" | "lines";
  className?: string;
  delay?: number;
  duration?: number;
  stagger?: number;
  scrub?: boolean | number;
  triggerHook?: string;
  once?: boolean;
}

export function SplitReveal({
  children,
  as: Tag = "div",
  type = "words",
  className = "",
  delay = 0,
  duration = 1.1,
  stagger = 0.04,
  once = true,
}: SplitRevealProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll(".split-unit");
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y: 35,
          rotateX: 15,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration,
          ease: "power3.out",
          stagger,
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, duration, once, prefersReducedMotion, stagger]);

  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  // Split into units
  if (type === "chars") {
    const chars = Array.from(children);
    return (
      <Tag ref={containerRef as React.Ref<HTMLElement & HTMLHeadingElement & HTMLParagraphElement>} className={`${className} inline-block overflow-hidden`}>
        {chars.map((char, i) => (
          <span
            key={i}
            className="split-unit inline-block will-change-transform"
            style={{ display: char === " " ? "inline" : "inline-block" }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </Tag>
    );
  }

  // Default: words
  const words = children.split(" ");
  return (
    <Tag ref={containerRef as React.Ref<HTMLElement & HTMLHeadingElement & HTMLParagraphElement>} className={`${className} inline-block`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-top">
          <span className="split-unit inline-block will-change-transform">
            {word}&nbsp;
          </span>
        </span>
      ))}
    </Tag>
  );
}
