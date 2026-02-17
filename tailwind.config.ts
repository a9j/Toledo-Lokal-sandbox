import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        lokal: {
          midnight: "hsl(var(--lokal-midnight))",
          "midnight-light": "hsl(var(--lokal-midnight-light))",
          amber: "hsl(var(--lokal-amber))",
          "amber-light": "hsl(var(--lokal-amber-light))",
          terracotta: "hsl(var(--lokal-terracotta))",
          "terracotta-light": "hsl(var(--lokal-terracotta-light))",
          forest: "hsl(var(--lokal-forest))",
          "forest-light": "hsl(var(--lokal-forest-light))",
          sand: "hsl(var(--lokal-sand))",
          cream: "hsl(var(--lokal-cream))",
        },
        toledo: {
          coral: "hsl(var(--toledo-coral))",
          "coral-light": "hsl(var(--toledo-coral-light))",
          teal: "hsl(var(--toledo-teal))",
          "teal-light": "hsl(var(--toledo-teal-light))",
          navy: "hsl(var(--toledo-navy))",
          gold: "hsl(var(--toledo-gold))",
          purple: "hsl(var(--toledo-purple))",
          sage: "hsl(var(--toledo-sage))",
          "sage-light": "hsl(var(--toledo-sage-light))",
          rose: "hsl(var(--toledo-rose))",
          "rose-light": "hsl(var(--toledo-rose-light))",
          lavender: "hsl(var(--toledo-lavender))",
          "lavender-light": "hsl(var(--toledo-lavender-light))",
          clay: "hsl(var(--toledo-clay))",
          "clay-light": "hsl(var(--toledo-clay-light))",
          cream: "hsl(var(--toledo-cream))",
        },
        featured: "hsl(var(--featured))",
        verified: "hsl(var(--verified))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px -4px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 16px 40px -8px rgba(0, 0, 0, 0.12)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'glow-amber': '0 0 20px -5px hsla(38, 90%, 55%, 0.4)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "logo-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.08)", opacity: "0.85" },
        },
        "logo-ripple": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "celebration": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(-400px) scale(0)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "logo-pulse": "logo-pulse 1.6s ease-in-out infinite",
        "logo-ripple": "logo-ripple 1.6s ease-out infinite",
        "celebration": "celebration 1.5s ease-out forwards",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom, 0)",
        "safe-top": "env(safe-area-inset-top, 0)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
