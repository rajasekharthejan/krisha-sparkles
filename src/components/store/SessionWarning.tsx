"use client";

/**
 * SECURITY: Session Timeout Warning
 * Shows a banner 5 minutes before the Supabase session expires,
 * giving users a chance to extend their session or save their work.
 * Auto-signs out when session expires.
 */

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

const WARNING_BEFORE_MS = 5 * 60 * 1000; // warn 5 min before expiry

export default function SessionWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const router = useRouter();

  const extendSession = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.auth.refreshSession();
    if (!error) setShowWarning(false);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    useCartStore.getState().clearCart();
    if (typeof window !== "undefined") localStorage.removeItem("krisha-cart");
    router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let warningTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;
    let expireTimer: ReturnType<typeof setTimeout>;

    async function scheduleWarning() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.expires_at) return;

      const expiresMs = session.expires_at * 1000;
      const nowMs = Date.now();
      const msUntilExpiry = expiresMs - nowMs;

      // Clear any existing timers
      clearTimeout(warningTimer);
      clearTimeout(expireTimer);
      clearInterval(countdownInterval);

      if (msUntilExpiry <= 0) return;

      const msUntilWarning = msUntilExpiry - WARNING_BEFORE_MS;

      if (msUntilWarning > 0) {
        // Schedule warning banner
        warningTimer = setTimeout(() => {
          setShowWarning(true);
          setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));
          countdownInterval = setInterval(() => {
            setSecondsLeft((s) => {
              if (s <= 1) { clearInterval(countdownInterval); return 0; }
              return s - 1;
            });
          }, 1000);
        }, msUntilWarning);
      } else {
        // We're already in the warning window
        setShowWarning(true);
        setSecondsLeft(Math.max(0, Math.floor(msUntilExpiry / 1000)));
        countdownInterval = setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) { clearInterval(countdownInterval); return 0; }
            return s - 1;
          });
        }, 1000);
      }

      // Auto sign out at expiry
      expireTimer = setTimeout(() => {
        setShowWarning(false);
        signOut();
      }, msUntilExpiry);
    }

    scheduleWarning();

    // Re-schedule whenever session refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") {
        setShowWarning(false);
        scheduleWarning();
      }
      if (event === "SIGNED_OUT") {
        setShowWarning(false);
        clearTimeout(warningTimer);
        clearTimeout(expireTimer);
        clearInterval(countdownInterval);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(warningTimer);
      clearTimeout(expireTimer);
      clearInterval(countdownInterval);
    };
  }, [signOut]);

  if (!showWarning) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
        background: "rgba(17,17,17,0.97)",
        border: "1px solid rgba(245,158,11,0.5)",
        borderRadius: "12px",
        padding: "1rem 1.25rem",
        maxWidth: "320px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        backdropFilter: "blur(16px)",
        animation: "scaleIn 0.2s ease",
      }}
    >
      <p style={{ fontSize: "0.82rem", color: "#f59e0b", fontWeight: 700, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        Session expiring in {timeStr}
      </p>
      <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: "0.85rem", lineHeight: 1.5 }}>
        Your session is about to expire. Stay signed in?
      </p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={extendSession}
          style={{
            flex: 1, background: "#c9a84c", color: "#0a0a0a",
            border: "none", borderRadius: "6px",
            padding: "0.45rem 0.75rem", fontSize: "0.78rem",
            fontWeight: 700, cursor: "pointer",
          }}
        >
          Stay Signed In
        </button>
        <button
          onClick={signOut}
          style={{
            flex: 1, background: "rgba(239,68,68,0.12)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "6px",
            padding: "0.45rem 0.75rem", fontSize: "0.78rem",
            fontWeight: 700, cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
