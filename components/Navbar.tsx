"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useSmoothScroll } from "./providers/SmoothScrollProvider";

const NAV_LINKS = [
  { label: "Signatures", href: "#signature" },
  { label: "The Craft", href: "#craft" },
  { label: "Our Story", href: "#story" },
  { label: "Ingredients", href: "#balance" },
  { label: "The Menu", href: "#menu" },
  { label: "Visit Us", href: "#visit" },
];

export function Navbar() {
  const { scrollTo, lenis } = useSmoothScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOverCream, setIsOverCream] = useState(false);
  const isScrolledRef = useRef(false);
  const isVisibleRef = useRef(true);
  const isOverCreamRef = useRef(false);
  const lastScrollYRef = useRef(0);

  // Lock scroll and stop Lenis while mobile menu overlay is open
  useEffect(() => {
    if (mobileMenuOpen) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, lenis]);

  useEffect(() => {
    // 1. Observe light sections without layout reads during scroll
    const creamSectionIds = ["craft", "story", "balance", "menu"];
    const intersectingSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingSections.add(entry.target.id);
          } else {
            intersectingSections.delete(entry.target.id);
          }
        });
        const overCream = intersectingSections.size > 0;
        if (overCream !== isOverCreamRef.current) {
          isOverCreamRef.current = overCream;
          setIsOverCream(overCream);
        }
      },
      { rootMargin: "-50px 0px -75% 0px" }
    );

    creamSectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // 2. Passive scroll listener for navbar show/hide without layout reads
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrolled = currentScrollY > 20;
      if (scrolled !== isScrolledRef.current) {
        isScrolledRef.current = scrolled;
        setIsScrolled(scrolled);
      }

      let visible = isVisibleRef.current;
      if (currentScrollY < 80) {
        visible = true;
      } else if (currentScrollY > lastScrollYRef.current + 8) {
        visible = false;
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        visible = true;
      }
      lastScrollYRef.current = currentScrollY;

      if (visible !== isVisibleRef.current) {
        isVisibleRef.current = visible;
        setIsVisible(visible);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] py-2.5 sm:py-3 px-3 sm:px-6 pt-[max(0.6rem,env(safe-area-inset-top,0px))] ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div
          style={
            isScrolled
              ? {
                  backgroundColor: isOverCream ? "rgba(46, 10, 16, 0.55)" : "rgba(46, 10, 16, 0.35)",
                  backdropFilter: "blur(14px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(14px) saturate(1.2)",
                  border: "1px solid rgba(246, 236, 221, 0.18)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.37)",
                }
              : undefined
          }
          className={`mx-auto flex items-center justify-between transition-all duration-500 max-w-5xl h-[52px] sm:h-[54px] rounded-full px-5 sm:px-8 whitespace-nowrap ${
            isScrolled
              ? "nav-pill-glass"
              : "bg-transparent border border-transparent"
          }`}
        >
          {/* Brand Logo - NO DOT */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "#hero")}
            className="group flex items-center select-none whitespace-nowrap flex-shrink-0 min-h-[44px]"
            data-cursor="open"
          >
            <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] font-normal text-cream group-hover:text-gold transition-colors duration-300 whitespace-nowrap">
              AURELIA
            </span>
          </a>

          {/* Desktop Nav Links (Visible 900px and up) */}
          <nav className="hidden min-[900px]:flex items-center gap-6 lg:gap-8 flex-nowrap">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="group relative py-1 text-xs uppercase tracking-[0.18em] text-blush/85 hover:text-cream transition-colors duration-300 font-sans whitespace-nowrap flex-shrink-0"
              >
                <span className="whitespace-nowrap">{link.label}</span>
                {/* Underline draw */}
                <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-gold transition-all duration-500 ease-out group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Action Area: Reserve Button + Mobile Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Reserve Button: visible on desktop, tablet (>=600px), moves to overlay on phone */}
            <a
              href="#visit"
              onClick={(e) => handleNavClick(e, "#visit")}
              className="hidden sm:inline-flex relative items-center justify-center rounded-full bg-gold px-4 sm:px-5 py-2 text-xs uppercase tracking-[0.2em] font-medium text-wine hover:bg-gold-light hover:shadow-[0_0_20px_rgba(212,175,122,0.4)] transition-all duration-300 active:scale-95 whitespace-nowrap min-h-[44px] min-w-[44px]"
              data-cursor="open"
            >
              Reserve
            </a>

            {/* Mobile Menu Button (below 900px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-[900px]:hidden p-2.5 text-gold hover:text-cream transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
              data-cursor="open"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Overlay Menu (<900px) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99] flex flex-col justify-between bg-gradient-to-b from-[#1E060A] via-[#2E0A10] to-[#5A1420] px-6 sm:px-10 pt-20 pb-10 min-[900px]:hidden overflow-y-auto"
          >
            {/* Top Bar with Clear Close Button */}
            <div className="flex items-center justify-between pb-6 border-b border-gold/15">
              <span className="font-serif text-2xl tracking-[0.2em] text-cream">
                AURELIA
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2.5 text-gold hover:text-cream transition-colors flex items-center justify-center rounded-full bg-gold/10"
                aria-label="Close navigation menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Nav Links with Staggered Reveal */}
            <nav className="relative z-10 flex flex-col gap-4 py-8">
              <span className="eyebrow-badge mb-1">Navigation</span>
              {NAV_LINKS.map((link, idx) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.4, ease: "easeOut" }}
                  className="font-serif text-2xl sm:text-3xl text-cream hover:text-gold transition-colors flex items-center justify-between border-b border-gold/10 pb-3 min-h-[44px]"
                >
                  <span>{link.label}</span>
                  <span className="text-xs font-sans tracking-widest text-gold/60 font-mono">
                    0{idx + 1}
                  </span>
                </motion.a>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div className="relative z-10 flex flex-col gap-4 pt-4 border-t border-gold/15">
              <a
                href="#visit"
                onClick={(e) => handleNavClick(e, "#visit")}
                className="w-full text-center rounded-full bg-gold py-3.5 sm:py-4 text-xs uppercase tracking-[0.2em] font-medium text-wine min-h-[48px] flex items-center justify-center font-sans shadow-lg active:scale-98"
              >
                Reserve a Table
              </a>
              <p className="text-center text-[11px] sm:text-xs tracking-widest text-blush/60 font-sans">
                12TH MAIN ROAD · INDIRANAGAR, BENGALURU
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
