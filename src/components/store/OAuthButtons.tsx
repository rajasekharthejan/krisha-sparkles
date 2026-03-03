"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "392749034350-2rul3jqdu59240tg2l595enhqejcqoev.apps.googleusercontent.com";

interface OAuthButtonsProps {
  redirectTo?: string;
}

export default function OAuthButtons({ redirectTo = "/account" }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [gsiReady, setGsiReady] = useState(false);
  const router = useRouter();
  const redirectRef = useRef(redirectTo);
  redirectRef.current = redirectTo;
  const googleWrapperRef = useRef<HTMLDivElement>(null);

  // Handle Google credential response
  const handleGoogleCredential = useCallback(
    async (response: { credential: string }) => {
      setLoadingProvider("google");
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
        });
        if (error) {
          console.error("Google sign-in error:", error.message);
          setLoadingProvider(null);
          return;
        }
        router.push(redirectRef.current);
      } catch (err) {
        console.error("Google sign-in failed:", err);
        setLoadingProvider(null);
      }
    },
    [router]
  );

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      setGsiReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiReady(true);
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  // Initialize GIS and render the invisible Google button over our styled button
  useEffect(() => {
    if (!gsiReady || !googleWrapperRef.current) return;
    const g = (window as any).google?.accounts?.id;
    if (!g) return;

    g.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      ux_mode: "popup",
      use_fedcm_for_prompt: false,
    });

    // Render Google's real button — it fills the wrapper div.
    // The wrapper is positioned on top of our styled button but transparent,
    // so the user's click goes to Google's iframe and opens the real popup.
    g.renderButton(googleWrapperRef.current, {
      type: "standard",
      shape: "rectangular",
      theme: "filled_black",
      size: "large",
      width: googleWrapperRef.current.offsetWidth || 400,
      text: "continue_with",
    });
  }, [gsiReady, handleGoogleCredential]);

  // Redirect flow for Apple (and fallback for Google)
  async function handleOAuthRedirect(provider: "google" | "apple") {
    setLoadingProvider(provider);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  const btnBase: React.CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text)",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      {/* Google — invisible GIS button overlays our styled button */}
      <div style={{ position: "relative" }}>
        {/* Our styled visual button (underneath) */}
        <button
          type="button"
          disabled={loadingProvider !== null}
          style={{ ...btnBase, pointerEvents: "none" }}
        >
          {loadingProvider === "google" ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Invisible Google-rendered button on top — captures the real click */}
        <div
          ref={googleWrapperRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0.0001,
            overflow: "hidden",
            cursor: "pointer",
            zIndex: 1,
          }}
        />

        {/* Fallback: if GIS doesn't render in 3s, show a clickable overlay for redirect flow */}
        {!gsiReady && (
          <button
            type="button"
            onClick={() => handleOAuthRedirect("google")}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              zIndex: 2,
              border: "none",
              background: "transparent",
            }}
            aria-label="Continue with Google"
          />
        )}
      </div>

      {/* Apple — uses redirect flow */}
      <button
        type="button"
        onClick={() => handleOAuthRedirect("apple")}
        disabled={loadingProvider !== null}
        style={btnBase}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.22)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
      >
        {loadingProvider === "apple" ? (
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor" aria-hidden>
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.1L66 729.3c-43.5-62.9-104.6-165.4-104.6-265.7 0-154.7 101.5-236.7 201.5-236.7 71.2 0 130.3 46.5 172.1 46.5 39.5 0 101.4-49.1 183.7-49.1 29.4 0 108.2 2.6 168.8 88.9zm-56.3-198.5c27.5-32.5 47.5-78.1 47.5-123.8 0-6.1-.5-12.3-1.5-18.4-45.3 1.7-99.5 30.3-131.9 66.9-25.2 27.9-48.3 73.1-48.3 119.3 0 6.8 1.2 13.7 1.7 15.8 2.9.4 7.5 1.1 12.1 1.1 40.8 0 91.1-27.1 120.4-60.9z"/>
          </svg>
        )}
        Continue with Apple
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
        <span style={{ color: "var(--muted)", fontSize: "0.75rem", flexShrink: 0 }}>or continue with email</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
      </div>
    </div>
  );
}
