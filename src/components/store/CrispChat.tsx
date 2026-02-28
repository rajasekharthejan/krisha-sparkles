"use client";

/**
 * CrispChat — Injects the Crisp live chat widget.
 *
 * Features:
 * - Lazy-loads Crisp script (after page interactive)
 * - Auto-injects user email + name if logged in (identity injection)
 * - Exports openCrisp() for programmatic chat opening
 * - Guards on NEXT_PUBLIC_CRISP_WEBSITE_ID env var
 *
 * Setup:
 * 1. Sign up at https://crisp.chat → Create website → Copy Website ID
 * 2. Add NEXT_PUBLIC_CRISP_WEBSITE_ID=your-id to Vercel env vars
 * 3. Add <CrispChat /> to store layout
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

/** Programmatically open the Crisp chat window */
export function openCrisp() {
  if (typeof window === "undefined") return;
  try {
    (window.$crisp as unknown as { push: (args: unknown[]) => void }).push(["do", "chat:open"]);
  } catch {
    // Crisp not loaded yet
  }
}

export default function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!websiteId) return;

    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    // After Crisp loads, inject user identity if logged in
    script.onload = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const crisp = window.$crisp as unknown as { push: (args: unknown[]) => void };
          crisp.push(["set", "user:email", [user.email]]);
          const name = user.user_metadata?.full_name || user.user_metadata?.name;
          if (name) crisp.push(["set", "user:nickname", [name]]);
        }
      } catch {
        // ignore auth errors
      }
    };

    return () => {
      // Cleanup on unmount (SPA navigation)
      try {
        document.head.removeChild(script);
      } catch {
        // already removed
      }
    };
  }, [websiteId]);

  // No visible UI — Crisp renders its own bubble
  return null;
}
