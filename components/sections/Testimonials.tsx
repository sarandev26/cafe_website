"use client";

import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { IMAGES } from "@/lib/images";

const REVIEWS = [
  {
    id: "review-1",
    name: "Ananya Sen",
    city: "Bengaluru",
    avatar: "AS",
    quote:
      "A quiet masterpiece in Indiranagar. The acoustic stillness makes the pour-over experience feel like a private morning meditation that stays with you all day.",
    photo: IMAGES.testimonials[0],
    tilt: "-3deg",
  },
  {
    id: "review-2",
    name: "Rohan Mehra",
    city: "Mumbai",
    avatar: "RM",
    quote:
      "The single-origin Guji highlands roast pulled through calibrated ceramics is sublime. You taste the terroir and altitude in every thoughtful, balanced sip.",
    photo: IMAGES.testimonials[1],
    tilt: "0deg",
    isFeatured: true,
  },
  {
    id: "review-3",
    name: "Priyanka Nambiar",
    city: "New Delhi",
    avatar: "PN",
    quote:
      "An oasis of sensory composition. From the Tahitian vanilla bean reduction to the flaky pistachio brioche, the patience in craft is truly peerless.",
    photo: IMAGES.testimonials[2],
    tilt: "3deg",
  },
];

export function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const container = cardsContainerRef.current;
    if (!section || !container || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const cards = container.querySelectorAll(".testimonial-card");
      gsap.fromTo(
        cards,
        { opacity: 0, y: 50, rotate: 0 },
        {
          opacity: 1,
          y: 0,
          rotate: (i) => (i === 0 ? -3 : i === 2 ? 3 : 0),
          duration: 1,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      id="testimonials"
      data-section="testimonials"
      ref={sectionRef}
      className="relative w-full bg-[#1E060A] py-24 md:py-32 px-5 md:px-10 lg:px-16 text-cream select-none overflow-hidden z-20 border-t border-gold/15"
      style={{ paddingTop: "calc(var(--nav-h) + 2rem)" }}
    >
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Centered Small Tag Pill & Big Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20">
          <span className="eyebrow-badge !text-gold mb-3 block">
            TESTIMONIALS
          </span>
          <h2 className="font-editorial-headline text-3xl sm:text-5xl md:text-6xl text-cream tracking-tight">
            Loved by our <span className="italic font-normal text-gold">guests</span>.
          </h2>
          <p className="font-editorial-body text-blush/80 text-sm sm:text-base mt-4 font-light leading-relaxed">
            Reflections from morning patrons, design practitioners, and coffee purists who make Aurelia their ritual sanctuary.
          </p>
        </div>

        {/* Row of Three Review Cards (Tilted on desktop, 0° on mobile with swipeable snap) */}
        <div
          ref={cardsContainerRef}
          className="flex min-[900px]:grid min-[900px]:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 items-center overflow-x-auto min-[900px]:overflow-visible pb-6 min-[900px]:pb-0 snap-x snap-mandatory no-scrollbar"
        >
          {REVIEWS.map((review, idx) => (
            <div
              key={review.id}
              className={`testimonial-card group relative rounded-[28px] bg-[#FAF5EE] text-[#2B1A17] p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gold/35 transition-all duration-500 ease-out cursor-pointer snap-center w-[84vw] max-w-[340px] flex-shrink-0 min-[900px]:w-auto min-[900px]:flex-shrink ${
                review.isFeatured
                  ? "min-[900px]:-translate-y-4 min-[900px]:scale-104 shadow-[0_25px_60px_rgba(0,0,0,0.65)]"
                  : ""
              } hover:!rotate-0 hover:!-translate-y-4 hover:shadow-[0_30px_70px_rgba(212,175,55,0.25)] hover:border-gold`}
              style={{
                transform: `rotate(${review.tilt})`,
              }}
            >
              {/* Photo at the top with rounded corners */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#2B1A17]/10 mb-5 border border-[#2B1A17]/10">
                <Image
                  src={review.photo.src}
                  alt={review.photo.alt}
                  fill
                  sizes="(max-width: 768px) 320px, 400px"
                  className="object-cover warm-grade transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Five Gold Stars */}
              <div className="flex items-center gap-1 mb-3.5 text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} fill="#D4AF37" stroke="#D4AF37" />
                ))}
              </div>

              {/* 3-4 Line Quote */}
              <p className="font-serif italic text-base sm:text-lg text-[#2B1A17] leading-relaxed mb-6 font-normal min-h-[4.5em]">
                &ldquo;{review.quote}&rdquo;
              </p>

              {/* Bottom Pill: Avatar (Initials) + Guest Name and City */}
              <div className="pt-4 border-t border-[#2B1A17]/10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#2E0A10]/8 border border-gold/40">
                  <div className="h-7 w-7 rounded-full bg-[#2E0A10] text-gold text-xs font-mono font-medium flex items-center justify-center flex-shrink-0">
                    {review.avatar}
                  </div>
                  <span className="font-sans text-xs tracking-wide text-[#2B1A17] font-medium">
                    {review.name} · <span className="text-[#8E7265]">{review.city}</span>
                  </span>
                </div>

                <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E7265]">
                  0{idx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
