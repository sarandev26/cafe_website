"use client";

import React, { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ParallaxImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  speed?: number; // 0.1 to 0.5
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  aspectRatio?: string;
  reveal?: boolean;
  scaleHover?: boolean;
  fill?: boolean;
  sizes?: string;
}

export function ParallaxImage({
  src,
  alt,
  width,
  height,
  speed = 0.25,
  className = "",
  imgClassName = "",
  priority = false,
  aspectRatio,
  reveal = true,
  scaleHover = true,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const container = containerRef.current;
    const imgWrapper = imageRef.current;
    if (!container || !imgWrapper || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Parallax vertical translation
      const yOffset = 100 * speed;

      gsap.fromTo(
        imgWrapper,
        {
          yPercent: -yOffset * 0.5,
          scale: 1.12,
        },
        {
          yPercent: yOffset * 0.5,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );

      // Reveal animation on entrance
      if (reveal) {
        gsap.fromTo(
          container,
          {
            clipPath: "inset(15% 0% 15% 0%)",
            opacity: 0.85,
          },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              once: true,
            },
          }
        );
      }
    }, container);

    return () => ctx.revert();
  }, [speed, reveal, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden group ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      data-cursor="view"
    >
      <div
        ref={imageRef}
        className={`relative w-full h-full transition-transform duration-700 ease-out ${
          scaleHover ? "group-hover:scale-[1.04]" : ""
        }`}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className={`object-cover warm-grade ${imgClassName}`}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width || 800}
            height={height || 1000}
            sizes={sizes}
            priority={priority}
            className={`w-full h-full object-cover warm-grade ${imgClassName}`}
          />
        )}
      </div>

      {/* Subtle luxury ambient highlight vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-wine/30 via-transparent to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-20"
        aria-hidden="true"
      />
    </div>
  );
}
