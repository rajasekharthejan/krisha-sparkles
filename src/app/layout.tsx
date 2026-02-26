import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import GTMScript from "@/components/GTMScript";
import MetaPixel from "@/components/MetaPixel";
import TikTokPixel from "@/components/TikTokPixel";
import WhatsAppButton from "@/components/WhatsAppButton";
import "./globals.css";

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
  metadataBase: new URL("https://krisha-sparkles.vercel.app"),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
      </head>
      <body style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
        {children}
        <WhatsAppButton />
        <Analytics />
        <GoogleAnalytics />
        <GTMScript />
        <MetaPixel />
        <TikTokPixel />
      </body>
    </html>
  );
}
