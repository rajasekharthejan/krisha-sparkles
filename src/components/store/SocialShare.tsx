"use client";

import { useState } from "react";
import { Twitter, Facebook, Link2, Check } from "lucide-react";

interface SocialShareProps {
  title: string;
  url?: string;
}

export default function SocialShare({ title, url }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title, url: shareUrl });
    } else {
      handleCopy();
    }
  }

  const btnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.9rem",
    borderRadius: "6px",
    border: "1px solid var(--gold-border)",
    background: "transparent",
    color: "var(--muted)",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    textDecoration: "none",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 600, marginRight: "0.25rem" }}>Share:</span>

      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnStyle, color: "#1da1f2", borderColor: "rgba(29,161,242,0.3)" }}
      >
        <Twitter size={13} /> Twitter
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnStyle, color: "#4267B2", borderColor: "rgba(66,103,178,0.3)" }}
      >
        <Facebook size={13} /> Facebook
      </a>

      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ ...btnStyle, color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }}
      >
        <span style={{ fontSize: "13px" }}>💬</span> WhatsApp
      </a>

      <button onClick={handleCopy} style={{ ...btnStyle, color: copied ? "#10b981" : "var(--muted)", borderColor: copied ? "rgba(16,185,129,0.4)" : "var(--gold-border)" }}>
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
