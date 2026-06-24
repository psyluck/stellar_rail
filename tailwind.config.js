// ─────────────────────────────────────────────────────────────────────────────
// CenDTrus Remit — Tailwind CSS Configuration
// Extends Tailwind with the proprietary CenTrus visual identity:
//   • bg-navy / bg-navy-light   → deep institutional containers
//   • bg-mint / bg-mint-deep    → icy crystalline background surface
//   • emerald-accent            → primary action / live data accent
// ─────────────────────────────────────────────────────────────────────────────

/** @type {import('tailwindcss').Config} */
export default {
  // Only include classes actually used in source files (tree-shaking)
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        // ── Institutional Container Colors ───────────────────────────────────
        'navy': {
          DEFAULT: '#0F172A',   // Primary card/container background
          'light': '#1E293B',   // Secondary surface, slightly lifted
          'border': '#334155',  // Subtle border within navy surfaces
        },

        // ── Icy Mint Green Surface ───────────────────────────────────────────
        'mint': {
          DEFAULT: '#F0FDF4',   // Primary page background — crystalline pastel
          'deep': '#E8FAF0',    // Slightly deeper mint for alternating sections
          'border': '#BBF7D0',  // Mint-green dividers and borders
        },

        // ── Emerald Accent System ────────────────────────────────────────────
        'emerald-accent': {
          DEFAULT: '#10B981',   // Primary CTA, status "SECURE", live indicators
          'deep': '#059669',    // Hover state, pressed state
          'glow': '#34D399',    // Pulse animations, "live" dot indicators
          'warn': '#F59E0B',    // Amber — Sovereign Shield approaching ceiling
          'danger': '#EF4444',  // Red — Shield triggered, HITL engaged
        },

        // ── Data/Text Neutrals ───────────────────────────────────────────────
        'slate-ghost': '#94A3B8',  // Muted labels on navy cards
        'slate-mid': '#CBD5E1',    // Secondary data on navy surfaces
      },

      // Custom font stack — monospace for financial data panels
      fontFamily: {
        'mono-finance': ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
        'display': ['"Inter"', 'system-ui', 'sans-serif'],
      },

      // Custom animation for the live data pulse
      keyframes: {
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.92)' },
        },
        'shield-warn': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
          '50%': { boxShadow: '0 0 0 6px rgba(245, 158, 11, 0.3)' },
        },
        'packet-slide': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'live-pulse': 'live-pulse 2s ease-in-out infinite',
        'shield-warn': 'shield-warn 1.5s ease-in-out infinite',
        'packet-slide': 'packet-slide 0.4s ease-out forwards',
      },

      // Utility border radii matching the "premium card" aesthetic
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },

      boxShadow: {
        'navy-card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)',
        'emerald-glow': '0 0 20px rgba(16, 185, 129, 0.25)',
      },
    },
  },

  plugins: [],
}
