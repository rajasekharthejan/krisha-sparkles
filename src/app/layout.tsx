import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GTMScript from "@/components/GTMScript";
import MetaPixel from "@/components/MetaPixel";
import TikTokPixel from "@/components/TikTokPixel";
import WhatsAppButton from "@/components/WhatsAppButton";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

const THEME_COLORS: Record<string, string> = {
  dark:  "#0a0a0a",
  pearl: "#faf9f7",
  rose:  "#130d10",
};

async function getActiveTheme(): Promise<string> {
  noStore(); // always read latest — skips Next.js data cache
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", "active_theme")
      .single();
    const theme = data?.value || "dark";
    return ["dark", "pearl", "rose"].includes(theme) ? theme : "dark";
  } catch {
    return "dark"; // never break the site if DB is unreachable
  }
}

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shopkrisha.com"),
  title: {
    default: "Krisha Sparkles — Exquisite Imitation Jewelry",
    template: "%s | Krisha Sparkles",
  },
  description:
    "Discover stunning imitation jewelry and ethnic wear at Krisha Sparkles. Handpicked collections of necklaces, earrings, bangles, pendant sets, and Jadau jewelry.",
  keywords: [
    "imitation jewelry",
    "Indian jewelry",
    "Jadau jewelry",
    "pendant sets",
    "ethnic earrings",
    "Krisha Sparkles",
    "fashion jewelry USA",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Krisha Sparkles",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Krisha Sparkles — Exquisite Imitation Jewelry",
    description:
      "Handpicked imitation jewelry & ethnic wear. Shop necklaces, earrings, bangles & more.",
    type: "website",
    siteName: "Krisha Sparkles",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  icons: {
    icon: [
      { url: "/icons/icon-96.png",  sizes: "96x96" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getActiveTheme();
  const themeColor = THEME_COLORS[theme] ?? "#0a0a0a";

  return (
    <html lang="en" data-theme={theme} className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content={themeColor} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
        {/* Pre-connect to Supabase CDN — saves ~300ms DNS+TLS on first image */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
      </head>
      <body style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
        {children}
        <WhatsAppButton />
        <CookieConsentBanner />
        <Analytics />
        <GoogleAnalytics />
        <GTMScript />
        <MetaPixel />
        <TikTokPixel />
      </body>
    </html>
  );
}
