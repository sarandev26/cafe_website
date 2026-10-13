"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  className?: string;
  magneticRadius?: number;
}

export function MagneticButton({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
  magneticRadius = 50,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = buttonRef.current;
    const textEl = textRef.current;
    if (!el || !textEl || prefersReducedMotion) return;

    // Set up quickTo springs
    const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "power3.out" });
    const textXTo = gsap.quickTo(textEl, "x", { duration: 0.6, ease: "power3.out" });
    const textYTo = gsap.quickTo(textEl, "y", { duration: 0.6, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.hypot(distX, distY);

      if (distance < rect.width / 2 + magneticRadius) {
        xTo(distX * 0.35);
        yTo(distY * 0.35);
        textXTo(distX * 0.15);
        textYTo(distY * 0.15);
      }
    };

    const handleMouseLeave = () => {
      xTo(0);
      yTo(0);
      textXTo(0);
      textYTo(0);
    };

    el.addEventListener("mousemove", handleMouseMove as EventListener);
    el.addEventListener("mouseleave", handleMouseLeave as EventListener);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove as EventListener);
      el.removeEventListener("mouseleave", handleMouseLeave as EventListener);
      gsap.set([el, textEl], { x: 0, y: 0 });
    };
  }, [magneticRadius, prefersReducedMotion]);

  // Variant classes
  const baseStyles =
    "group relative inline-flex items-center justify-center rounded-full px-7 py-3.5 text-xs uppercase tracking-[0.2em] font-medium transition-all duration-500 cursor-pointer select-none overflow-hidden";

  const variantStyles = {
    primary:
      "bg-gold text-wine hover:bg-gold-light hover:shadow-[0_0_24px_rgba(212,175,122,0.4)] active:scale-95",
    secondary:
      "bg-[#F6ECDD] text-[#5A1420] font-semibold border border-[#F6ECDD] hover:bg-cream hover:border-gold hover:text-wine active:scale-95 shadow-md",
    ghost:
      "bg-transparent text-blush hover:text-gold active:scale-95",
  }[variant];

  const content = (
    <>
      {/* Subtle shine highlight */}
      <span
        className="pointer-events-none absolute -inset-full top-0 block -rotate-45 bg-gradient-to-r from-transparent via-cream/15 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        aria-hidden="true"
      />
      <span ref={textRef} className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={buttonRef as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        className={`${baseStyles} ${variantStyles} ${className}`}
        data-cursor="magnetic"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={buttonRef as React.Ref<HTMLButtonElement>}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      data-cursor="magnetic"
      {...props}
    >
      {content}
    </button>
  );
}
