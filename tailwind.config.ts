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
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C96A",
          dark: "#A07A2A",
          muted: "rgba(201,168,76,0.15)",
        },
        dark: {
          DEFAULT: "#0A0A0A",
          surface: "#111111",
          elevated: "#1A1A1A",
          border: "rgba(201,168,76,0.2)",
        },
        krisha: {
          text: "#F5F5F5",
          muted: "#888888",
          subtle: "#555555",
        },
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)",
        "gold-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.4) 50%, transparent 100%)",
        "dark-gradient":
          "linear-gradient(180deg, #0A0A0A 0%, #111111 100%)",
        "hero-gradient":
          "linear-gradient(135deg, rgba(10,10,10,0.95) 0%, rgba(26,16,5,0.9) 100%)",
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "slide-in-right": "slideInRight 0.4s ease forwards",
        "slide-out-right": "slideOutRight 0.4s ease forwards",
        float: "float 3s ease-in-out infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        "bounce-subtle": "bounceSlight 2s ease-in-out infinite",
        "zoom-in": "zoomIn 0.3s ease forwards",
        "spin-diamond": "spinDiamond 6s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideOutRight: {
          "0%": { transform: "translateX(0)", opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,168,76,0)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(201,168,76,0.35)" },
        },
        bounceSlight: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        zoomIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        spinDiamond: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
      },
      boxShadow: {
        gold: "0 0 20px rgba(201,168,76,0.3)",
        "gold-lg": "0 0 40px rgba(201,168,76,0.4)",
        "gold-sm": "0 0 10px rgba(201,168,76,0.2)",
        dark: "0 8px 32px rgba(0,0,0,0.6)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
