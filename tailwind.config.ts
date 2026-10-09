import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
      },
      // Theme-aware colours come from CSS variables in globals.css (light on :root, dark on .dark).
      colors: {
        fg: "rgb(var(--c-fg) / <alpha-value>)",
        brand: {
          red: "#E11D2A",
          redDark: "#B3121E",
          black: "rgb(var(--c-bg) / <alpha-value>)",
          ink: "rgb(var(--c-ink) / <alpha-value>)",
          card: "rgb(var(--c-card) / <alpha-value>)",
          line: "rgb(var(--c-line) / <alpha-value>)",
          muted: "rgb(var(--c-muted) / <alpha-value>)",
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "fade-up": "fadeUp 0.8s ease both",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
