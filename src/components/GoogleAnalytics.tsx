"use client";

/**
 * GoogleAnalytics — only loads after cookie consent is granted.
 * On iOS WKWebView, consent is auto-declined → GA never loads.
 * This satisfies Apple App Store Guideline 5.1.2 (ATT / Privacy).
 */

import Script from "next/script";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const { consent } = useCookieConsent();

  // Only fire if GA ID exists AND user has granted consent
  if (!gaId || consent !== "granted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
