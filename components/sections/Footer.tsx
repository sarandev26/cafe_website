"use client";

import { ArrowUp } from "lucide-react";
import { useSmoothScroll } from "@/components/providers/SmoothScrollProvider";

const EXPLORE_LINKS = [
  { label: "Signature Collection", href: "#signature" },
  { label: "The Craft of Extraction", href: "#craft" },
  { label: "Chapter Two · Extraction", href: "#chapter-two" },
  { label: "Our Story", href: "#story" },
  { label: "Anatomy of Balance", href: "#balance" },
  { label: "The Menu", href: "#menu" },
  { label: "Visual Chronicle", href: "#moments" },
];

export function Footer() {
  const { scrollTo } = useSmoothScroll();

  return (
    <footer
      id="footer"
      data-section="footer"
      className="relative w-full bg-[#1E060A] text-cream select-none overflow-hidden border-t border-gold/15 z-20 pt-16 sm:pt-20 pb-0 px-6 sm:px-12 lg:px-20"
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* 4 Tidy Columns: 1 col below 360px, 2 cols on phones, 4 cols on large screens */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pb-12 sm:pb-14 border-b border-gold/15">
          {/* Column 1: Brand */}
          <div>
            <h3 className="font-serif text-2xl text-cream tracking-[0.15em] mb-3">
              AURELIA
            </h3>
            <p className="text-xs uppercase tracking-[0.25em] text-gold/80 font-sans mb-3 font-medium">
              SPECIALTY COFFEE HOUSE
            </p>
            <p className="font-editorial-body text-xs text-blush/70 leading-relaxed font-light max-w-xs">
              Single-origin terroir roasted in small batches on custom cast-iron drums, poured with stillness in the heart of Indiranagar.
            </p>
          </div>

          {/* Column 2: Explore Links with animated underlines */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-mono mb-4">
              Explore Sanctuary
            </h4>
            <ul className="space-y-2.5 text-xs text-blush/80 font-sans">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(link.href);
                    }}
                    className="group relative inline-block py-0.5 hover:text-gold transition-colors"
                  >
                    <span>{link.label}</span>
                    <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-gold transition-all duration-300 ease-out group-hover:w-full" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Visit Information */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-mono mb-4">
              Sanctuary Visit
            </h4>
            <div className="space-y-3 text-xs text-blush/80 font-sans leading-relaxed">
              <div>
                <span className="text-gold/90 block font-medium">Location</span>
                <span>Plot 14, 12th Main Road</span>
                <span className="block text-blush/60">HAL 2nd Stage, Indiranagar</span>
                <span className="block text-blush/60">Bengaluru, Karnataka 560038</span>
              </div>
              <div className="pt-1">
                <span className="text-gold/90 block font-medium">Hours</span>
                <span>Daily · 8:00 AM – 11:00 PM IST</span>
              </div>
            </div>
          </div>

          {/* Column 4: Contact & Socials */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gold font-mono mb-4">
              Concierge & Inquiries
            </h4>
            <div className="space-y-2.5 text-xs text-blush/80 font-sans">
              <div>
                <a
                  href="tel:+919876543210"
                  className="font-mono text-cream hover:text-gold transition-colors"
                >
                  +91 98765 43210
                </a>
              </div>
              <div>
                <a
                  href="mailto:hello@aureliacoffee.in"
                  className="hover:text-gold transition-colors"
                >
                  hello@aureliacoffee.in
                </a>
              </div>
              <div className="pt-3 flex items-center gap-4 text-[11px] uppercase tracking-widest text-gold/80">
                <a href="#hero" className="hover:text-gold transition-colors">
                  Instagram
                </a>
                <span>·</span>
                <a href="#hero" className="hover:text-gold transition-colors">
                  Spotify Rituals
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Copyright, Legal & Back to Top */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 text-[11px] text-blush/60 font-sans">
          <p>© 2026 Aurelia Coffee House. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#hero" className="hover:text-gold transition-colors">
              Privacy Policy
            </a>
            <a href="#hero" className="hover:text-gold transition-colors">
              Terms of Hospitality
            </a>
            <button
              onClick={() => scrollTo(0)}
              className="h-8 w-8 rounded-full border border-gold/30 hover:border-gold hover:bg-gold/10 text-gold flex items-center justify-center transition-all cursor-pointer ml-2"
              aria-label="Back to top"
            >
              <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Huge "AURELIA" wordmark half-hidden at the very bottom edge (cropped by overflow-hidden) */}
      <div
        className="w-full overflow-hidden pointer-events-none select-none text-center translate-y-[48%]"
        aria-hidden="true"
      >
        <span className="inline-block font-editorial-headline text-[clamp(6rem,19vw,22rem)] font-normal tracking-[0.18em] text-[#FAF5EE] opacity-[0.08] leading-none whitespace-nowrap">
          AURELIA
        </span>
      </div>
    </footer>
  );
}
