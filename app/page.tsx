"use client";

import React, { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Signature } from "@/components/sections/Signature";
import { Interlude } from "@/components/sections/Interlude";
import { Craft } from "@/components/sections/Craft";
import { Story } from "@/components/sections/Story";
import { Ingredients } from "@/components/sections/Ingredients";
import { Stats } from "@/components/sections/Stats";
import { MenuShowcase } from "@/components/sections/MenuShowcase";
import { Gallery } from "@/components/sections/Gallery";
import { Testimonials } from "@/components/sections/Testimonials";
import { Visit } from "@/components/sections/Visit";
import { Reserve } from "@/components/sections/Reserve";
import { Footer } from "@/components/sections/Footer";

// Development registry guard to prevent accidental duplicate section mounts
const mountedSectionRegistry = new Set<string>();

function SectionGuard({ id, children }: { id: string; children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (mountedSectionRegistry.has(id)) {
        const errorMsg = `[DEV GUARD] Duplicate section mounted: "${id}". Each section must appear exactly once!`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      mountedSectionRegistry.add(id);
      return () => {
        mountedSectionRegistry.delete(id);
      };
    }
  }, [id]);

  return <>{children}</>;
}

// Exactly ordered section manifest per Section 1 (strictly rendered once via map)
const SECTIONS = [
  { id: "hero", Component: Hero },
  { id: "signature", Component: Signature },
  { id: "chapter-two", Component: Interlude },
  { id: "craft", Component: Craft },
  { id: "story", Component: Story },
  { id: "balance", Component: Ingredients },
  { id: "numbers", Component: Stats },
  { id: "menu", Component: MenuShowcase },
  { id: "moments", Component: Gallery },
  { id: "testimonials", Component: Testimonials },
  { id: "visit", Component: Visit },
  { id: "reserve", Component: Reserve },
  { id: "footer", Component: Footer },
] as const;

export default function Home() {
  return (
    <>
      <Navbar />
      {SECTIONS.map(({ id, Component }) => (
        <SectionGuard key={id} id={id}>
          <Component />
        </SectionGuard>
      ))}
    </>
  );
}
