"use client";

import { useEffect } from "react";

/**
 * Google OAuth2 implicit-flow callback page.
 * Google redirects here with #id_token=... in the URL fragment.
 * We extract it, post it to the opener window, and close.
 */
export default function GoogleCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1); // remove '#'
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (idToken && window.opener) {
      // Send token back to the parent window that opened this popup
      window.opener.postMessage(
        { type: "GOOGLE_ID_TOKEN", id_token: idToken },
        window.location.origin
      );
      window.close();
    } else if (idToken && !window.opener) {
      // Opened in same tab (e.g., mobile) — store in sessionStorage and redirect
      sessionStorage.setItem("google_id_token", idToken);
      window.location.href = "/auth/login?google_callback=1";
    } else {
      // No token — something went wrong
      window.close();
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #0a0a0a)",
        color: "var(--text, #f5f5f5)",
      }}
    >
      <p>Signing you in...</p>
    </div>
  );
}
