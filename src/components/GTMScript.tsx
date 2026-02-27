"use client";

/**
 * GTMScript — only loads after cookie consent is granted.
 * On iOS WKWebView, consent is auto-declined → GTM never loads.
 * This satisfies Apple App Store Guideline 5.1.2 (ATT / Privacy).
 */

import Script from "next/script";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export default function GTMScript() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const { consent } = useCookieConsent();

  // Only fire if GTM ID exists AND user has granted consent
  if (!gtmId || consent !== "granted") return null;

  return (
    <Script
      id="gtm-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `,
      }}
    />
  );
}
