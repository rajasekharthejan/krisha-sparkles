"use client";

import { useState } from "react";
import { Tag, Copy, Check, X } from "lucide-react";

interface LiveDiscountBannerProps {
  code: string;
  label?: string | null;
}

export default function LiveDiscountBanner({
  code,
  label,
}: LiveDiscountBannerProps) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  };

  if (dismissed) return null;

  const bannerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "12px 20px",
    background: "linear-gradient(135deg, var(--gold, #c9a84c), #d4af37, #b8962a)",
    borderRadius: "10px",
    position: "relative",
    flexWrap: "wrap",
  };

  const contentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  };

  const iconStyle: React.CSSProperties = {
    color: "var(--bg, #0a0a0a)",
    flexShrink: 0,
  };

  const labelTextStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--bg, #0a0a0a)",
  };

  const codeBoxStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    background: "rgba(10, 10, 10, 0.15)",
    borderRadius: "6px",
    border: "1px dashed rgba(10, 10, 10, 0.3)",
  };

  const codeTextStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 800,
    color: "var(--bg, #0a0a0a)",
    letterSpacing: "1.5px",
    fontFamily: "monospace",
  };

  const copyBtnStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--bg, #0a0a0a)",
    background: "rgba(10, 10, 10, 0.12)",
    border: "1px solid rgba(10, 10, 10, 0.2)",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  };

  const dismissBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "6px",
    right: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    background: "rgba(10, 10, 10, 0.12)",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    color: "var(--bg, #0a0a0a)",
    transition: "background 0.2s ease",
  };

  return (
    <div style={bannerStyle}>
      <button
        style={dismissBtnStyle}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(10, 10, 10, 0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(10, 10, 10, 0.12)";
        }}
      >
        <X size={14} />
      </button>

      <div style={contentStyle}>
        <Tag size={18} style={iconStyle} />
        <span style={labelTextStyle}>
          {label || "Exclusive Live Discount"}
        </span>
        <div style={codeBoxStyle}>
          <span style={codeTextStyle}>{code}</span>
        </div>
        <button
          style={copyBtnStyle}
          onClick={handleCopy}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(10, 10, 10, 0.22)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(10, 10, 10, 0.12)";
          }}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
