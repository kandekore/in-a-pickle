import type { Config } from 'tailwindcss';

/**
 * Brand theme — "In a Pickle, sharpened".
 *
 * Keeps the client's green identity and the accessible, dyslexia-friendly body
 * face (Atkinson Hyperlegible), but pairs it with a confident display face
 * (Sora) and a sharper, higher-contrast system: deep forest "night" bands for
 * impact, crisp cards, and a single warm amber accent used sparingly.
 *
 * Accessibility choices retained:
 *  - Body text uses near-black `ink` on off-white surfaces (not pure #000/#fff).
 *  - Interactive greens (secondary/forest) carry white text for WCAG AA.
 *  - The amber accent only ever carries dark ink text.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Core brand greens (from brief)
        primary: { DEFAULT: '#4caf50', 600: '#43a047' },
        secondary: '#2e7d32',
        forest: '#1b5e20', // heading colour
        // Deep "night" greens for high-impact dark bands
        night: { DEFAULT: '#08170e', 800: '#0c2716', 700: '#123420' },
        // Warm amber accent (dark text only) — reads premium + high-vis
        accent: { DEFAULT: '#ffc531', 600: '#f0b41f' },
        // Bright signal-green used only for glows / tiny highlights on dark
        signal: '#5ef08a',

        ink: '#1a1c1a', // body text
        trim: '#e3e8e3', // borders / dividers

        // Light pastel-green surfaces for calm sections
        mint: {
          50: '#f4faf5',
          100: '#e7f4ea',
          200: '#cfe9d6',
        },
        surface: '#fbfdfb',
      },
      fontFamily: {
        sans: ['var(--font-atkinson)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'var(--font-atkinson)', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        prose: '66ch',
      },
      borderRadius: {
        lg: '0.6rem',
        xl: '0.85rem',
        '2xl': '1.1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 40, 24, 0.04), 0 12px 28px -18px rgba(16, 40, 24, 0.35)',
        lift: '0 2px 4px rgba(16, 40, 24, 0.06), 0 22px 40px -22px rgba(16, 40, 24, 0.45)',
        btn: '0 1px 2px rgba(16, 40, 24, 0.10), 0 8px 20px -12px rgba(27, 94, 32, 0.55)',
      },
      letterSpacing: {
        tightish: '-0.02em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
