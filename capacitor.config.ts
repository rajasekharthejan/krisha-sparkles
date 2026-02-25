import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.krishasparkles.app",
  appName: "Krisha Sparkles",
  webDir: "out",                // Next.js static export folder

  // ── Production: point to live Vercel deployment ──────────
  server: {
    url: "https://krisha-sparkles.vercel.app",
    cleartext: false,
  },

  // ── iOS Settings ─────────────────────────────────────────
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0a0a",
    allowsLinkPreview: false,
  },

  // ── Android Settings ─────────────────────────────────────
  android: {
    backgroundColor: "#0a0a0a",
    allowMixedContent: true,
    captureInput: true,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a0a",
    },
  },
};

export default config;
