import type { Config } from "tailwindcss";

/**
 * Design tokens. The source of truth is app/globals.css, where Tailwind v4 maps them in @theme.
 * Keep these values in step with it.
 */
export const tokens = {
  colors: {
    "bay-floor": "#0B0B0B",
    "bay-wall": "#151515",
    chalk: "#F2F2EF",
    hazard: "#1EFF66",
    torque: "#50BAA3",
    flag: "#FF5A4E",
  },
  fontFamily: {
    display: ["var(--font-inter-tight)", "sans-serif"],
    body: ["var(--font-inter-tight)", "sans-serif"],
    mono: ["var(--font-geist-mono)", "monospace"],
  },
} as const;

const config = {
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
    },
  },
} satisfies Config;

export default config;
