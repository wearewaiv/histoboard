import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light histology-inspired color scheme
        border: "hsl(280 20% 88%)",
        input: "hsl(280 20% 88%)",
        ring: "hsl(280 40% 60%)",
        background: "hsl(30 25% 97%)", // Warm cream background
        foreground: "hsl(280 30% 15%)",
        primary: {
          DEFAULT: "hsl(280 55% 45%)", // Deep purple (hematoxylin)
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(350 50% 95%)", // Soft rose tint
          foreground: "hsl(280 30% 20%)",
        },
        muted: {
          DEFAULT: "hsl(30 20% 94%)",
          foreground: "hsl(280 15% 45%)",
        },
        accent: {
          DEFAULT: "hsl(350 60% 92%)", // Eosin-inspired rose
          foreground: "hsl(280 30% 20%)",
        },
        destructive: {
          DEFAULT: "hsl(0 72% 51%)",
          foreground: "hsl(0 0% 100%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(280 30% 15%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(280 30% 15%)",
        },
        // Histology-inspired accent colors
        hematoxylin: {
          50: "hsl(280 60% 97%)",
          100: "hsl(280 55% 92%)",
          200: "hsl(280 50% 85%)",
          300: "hsl(280 50% 70%)",
          400: "hsl(280 55% 55%)",
          500: "hsl(280 55% 45%)",
          600: "hsl(280 55% 38%)",
          700: "hsl(280 50% 30%)",
          800: "hsl(280 45% 22%)",
          900: "hsl(280 40% 15%)",
        },
        eosin: {
          50: "hsl(350 80% 98%)",
          100: "hsl(350 70% 95%)",
          200: "hsl(350 65% 88%)",
          300: "hsl(350 60% 78%)",
          400: "hsl(350 60% 65%)",
          500: "hsl(350 60% 55%)",
          600: "hsl(350 55% 45%)",
          700: "hsl(350 50% 35%)",
          800: "hsl(350 45% 25%)",
          900: "hsl(350 40% 18%)",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
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
        "cell-pulse": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "cell-pulse": "cell-pulse 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-histology": "linear-gradient(135deg, hsl(280 55% 45%) 0%, hsl(350 60% 55%) 100%)",
        "gradient-histology-soft": "linear-gradient(135deg, hsl(280 40% 95%) 0%, hsl(350 50% 95%) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
