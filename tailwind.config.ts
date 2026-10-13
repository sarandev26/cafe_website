import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: "var(--burgundy, #5A1420)",
          light: "#721E2C",
          dark: "#440E17",
        },
        wine: {
          DEFAULT: "var(--wine, #2E0A10)",
          deep: "#1E060A",
        },
        cream: {
          DEFAULT: "var(--cream, #F6ECDD)",
          light: "#FAF4EC",
          dark: "#EDE0CD",
        },
        blush: {
          DEFAULT: "var(--blush, #E3CFC2)",
          muted: "rgba(227, 207, 194, 0.8)",
        },
        gold: {
          DEFAULT: "var(--gold, #D4AF7A)",
          light: "#E4C596",
          dark: "#B88E56",
          hairline: "rgba(212, 175, 122, 0.35)",
        },
        espresso: {
          DEFAULT: "var(--espresso, #2B1A17)",
          deep: "#1C110F",
        },
        taupe: {
          DEFAULT: "var(--taupe, #7A6258)",
          light: "#9A8074",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      letterSpacing: {
        eyebrow: "0.2em",
        wideDisplay: "0.08em",
      },
      lineHeight: {
        headline: "1.05",
      },
    },
  },
  plugins: [],
};
export default config;
