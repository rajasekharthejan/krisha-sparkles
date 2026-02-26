"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ReferralLandingPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code?.toUpperCase() ?? "";
  const router = useRouter();

  useEffect(() => {
    if (!code) {
      router.replace("/shop");
      return;
    }

    // Validate code exists then set cookie client-side
    fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          // Set 7-day referral cookie (client-side, non-HttpOnly)
          const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `ks_referral_code=${code}; path=/; expires=${expires}; SameSite=Lax`;
        }
        router.replace("/shop?ref=1");
      })
      .catch(() => router.replace("/shop"));
  }, [code, router]);

  return (
    <div
      style={{
        paddingTop: "80px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <p style={{ fontSize: "2rem" }}>✨</p>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading your referral…</p>
    </div>
  );
}
