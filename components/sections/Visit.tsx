"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

export function Visit() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        container,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  const address = "Plot 14, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038";
  const encodedAddress = encodeURIComponent(address);
  const mapIframeUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

  return (
    <section
      id="visit"
      data-section="visit"
      ref={sectionRef}
      className="relative w-full bg-[#2E0A10] py-24 md:py-32 px-5 md:px-10 lg:px-16 text-cream select-none overflow-hidden z-20 border-t border-gold/15"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      <div ref={containerRef} className="relative z-10 mx-auto max-w-7xl">
        {/* Simple 2-Column Layout (stacks vertically below 900px) */}
        <div className="grid grid-cols-1 min-[900px]:grid-cols-12 gap-10 min-[900px]:gap-16 items-center">
          {/* Left Column: Heading, Address, Hours, Phone & Email */}
          <div className="min-[900px]:col-span-6 flex flex-col justify-center">
            <span className="eyebrow-badge mb-3 block text-gold/90">
              VISIT US
            </span>
            <h2 className="font-editorial-headline text-3xl sm:text-5xl md:text-6xl text-cream tracking-tight mb-6">
              Come, sit a while.
            </h2>
            <p className="font-editorial-body text-blush/80 text-sm sm:text-base font-light leading-relaxed mb-8 max-w-lg">
              An acoustic sanctuary in Indiranagar, composed for quiet mornings, unhurried conversations, and slow ritual extractions.
            </p>

            {/* Address */}
            <div className="flex items-start gap-3.5 mb-6 text-cream/90">
              <MapPin size={18} className="text-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-widest text-gold font-mono block mb-1">
                  Location
                </span>
                <p className="text-sm sm:text-base font-sans leading-relaxed">
                  {address}
                </p>
              </div>
            </div>

            {/* Opening Hours in 2-3 short lines */}
            <div className="flex items-start gap-3.5 mb-6 text-cream/90">
              <Clock size={18} className="text-gold flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] uppercase tracking-widest text-gold font-mono block mb-1">
                  Sanctuary Hours
                </span>
                <p className="text-sm font-sans leading-relaxed">
                  Monday — Friday: 8:00 AM — 11:00 PM IST
                </p>
                <p className="text-sm font-sans leading-relaxed text-blush/80">
                  Saturday — Sunday: 8:00 AM — 11:30 PM IST
                </p>
              </div>
            </div>

            {/* Phone & Email as plain text with small icons */}
            <div className="pt-4 border-t border-gold/15 flex flex-col sm:flex-row gap-5 text-sm font-sans">
              <a
                href="tel:+919876543210"
                className="flex items-center gap-2.5 text-cream hover:text-gold transition-colors min-h-[44px]"
              >
                <Phone size={16} className="text-gold" />
                <span className="font-mono">+91 98765 43210</span>
              </a>

              <a
                href="mailto:hello@aureliacoffee.in"
                className="flex items-center gap-2.5 text-cream hover:text-gold transition-colors min-h-[44px]"
              >
                <Mail size={16} className="text-gold" />
                <span>hello@aureliacoffee.in</span>
              </a>
            </div>
          </div>

          {/* Right Column: One Google Maps embed iframe in a rounded card with a thin gold border (16:10, min 320px) */}
          <div className="min-[900px]:col-span-6 flex flex-col">
            <div className="relative w-full aspect-[16/10] min-h-[320px] rounded-3xl overflow-hidden border border-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-[#1E060A]">
              <iframe
                title="Aurelia Coffee House Google Maps Location"
                src={mapIframeUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: "contrast(1.05) saturate(0.9)" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
