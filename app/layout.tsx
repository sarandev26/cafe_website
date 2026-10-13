import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { Cursor } from "@/components/Cursor";
import { Loader } from "@/components/Loader";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Aurelia Coffee House — Coffee, composed.",
  description:
    "Aurelia Coffee House is an editorial specialty cafe in Tribeca. Single-origin beans, slow-roasted in small batches, and poured with intention.",
  keywords: [
    "Aurelia Coffee House",
    "Specialty Coffee",
    "Single Origin",
    "Tribeca Cafe",
    "Artisanal Espresso",
    "Pour Over",
    "Luxury Coffee",
  ],
  authors: [{ name: "Aurelia Coffee House" }],
  openGraph: {
    title: "Aurelia Coffee House — Coffee, composed.",
    description: "Single-origin beans, slow-roasted in small batches and poured with intention.",
    type: "website",
    locale: "en_US",
    siteName: "Aurelia Coffee House",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurelia Coffee House — Coffee, composed.",
    description: "Single-origin beans, slow-roasted in small batches and poured with intention.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E0A10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-[#2E0A10] text-blush antialiased selection:bg-gold selection:text-wine overflow-x-clip">
        {/* Subtle Film Grain Texture Overlay */}
        <div className="film-grain" aria-hidden="true" />

        <SmoothScrollProvider>
          {/* First-load editorial flash screen */}
          <Loader />

          {/* Desktop Custom Cursor */}
          <Cursor />

          <main id="main-content" className="relative w-full bg-[#2E0A10]">
            {children}
          </main>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
