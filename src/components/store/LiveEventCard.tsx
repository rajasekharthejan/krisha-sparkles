"use client";

import { useMemo } from "react";
import { Radio, Calendar, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { LiveEvent } from "@/types";

interface LiveEventCardProps {
  event: LiveEvent;
  variant: "live" | "upcoming" | "replay";
}

function formatScheduledDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCountdownText(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Starting soon";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

  if (days > 0) return `In ${days}d ${hours}h`;
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  if (hours > 0) return `In ${hours}h ${minutes}m`;
  return `In ${minutes}m`;
}

export default function LiveEventCard({ event, variant }: LiveEventCardProps) {
  const countdownText = useMemo(() => {
    if (variant === "upcoming" && event.scheduled_at) {
      return getCountdownText(event.scheduled_at);
    }
    return null;
  }, [variant, event.scheduled_at]);

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    borderRadius: "16px",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    background: "var(--surface, #141414)",
    overflow: "hidden",
    transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
    cursor: "pointer",
    textDecoration: "none",
    color: "inherit",
  };

  const thumbnailContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%", // 16:9 aspect ratio
    overflow: "hidden",
  };

  const thumbnailStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  };

  const fallbackGradientStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(135deg, var(--surface, #141414) 0%, var(--elevated, #1a1a1a) 50%, rgba(201,168,76,0.15) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const fallbackIconStyle: React.CSSProperties = {
    color: "var(--gold-muted, rgba(201,168,76,0.4))",
  };

  const badgeBaseStyle: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    left: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    zIndex: 5,
  };

  const liveBadgeStyle: React.CSSProperties = {
    ...badgeBaseStyle,
    background: "#e53e3e",
    color: "#ffffff",
  };

  const upcomingBadgeStyle: React.CSSProperties = {
    ...badgeBaseStyle,
    background: "rgba(201, 168, 76, 0.2)",
    color: "var(--gold, #c9a84c)",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
  };

  const replayBadgeStyle: React.CSSProperties = {
    ...badgeBaseStyle,
    background: "rgba(201, 168, 76, 0.9)",
    color: "var(--bg, #0a0a0a)",
  };

  const liveDotStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ffffff",
    animation: "liveCardPulse 1.5s ease-in-out infinite",
  };

  const countdownBadgeStyle: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    right: "12px",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: 600,
    background: "rgba(10, 10, 10, 0.7)",
    color: "var(--text, #f5f5f5)",
    backdropFilter: "blur(4px)",
    zIndex: 5,
  };

  const bodyStyle: React.CSSProperties = {
    padding: "16px 18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: 1,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--text, #f5f5f5)",
    fontFamily: "var(--font-playfair, serif)",
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    margin: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--muted, #888)",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    margin: 0,
  };

  const dateRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "var(--muted, #888)",
    marginTop: "4px",
  };

  return (
    <>
      <style>{`
        @keyframes liveCardPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <Link
        href={`/live/${event.slug}`}
        style={cardStyle}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(-4px)";
          el.style.boxShadow = "0 8px 24px rgba(201,168,76,0.15)";
          el.style.borderColor = "var(--gold, #c9a84c)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "none";
          el.style.borderColor = "var(--gold-border, rgba(201,168,76,0.3))";
        }}
      >
        {/* Thumbnail */}
        <div style={thumbnailContainerStyle}>
          {event.thumbnail ? (
            <img
              src={event.thumbnail}
              alt={event.title}
              style={thumbnailStyle}
            />
          ) : (
            <div style={fallbackGradientStyle}>
              <Radio size={40} style={fallbackIconStyle} />
            </div>
          )}

          {/* Variant badge */}
          {variant === "live" && (
            <div style={liveBadgeStyle}>
              <span style={liveDotStyle} />
              <Radio size={12} />
              LIVE NOW
            </div>
          )}
          {variant === "upcoming" && (
            <div style={upcomingBadgeStyle}>
              <Calendar size={12} />
              Upcoming
            </div>
          )}
          {variant === "replay" && (
            <div style={replayBadgeStyle}>
              <RotateCcw size={12} />
              Watch Replay
            </div>
          )}

          {/* Countdown badge for upcoming */}
          {variant === "upcoming" && countdownText && (
            <div style={countdownBadgeStyle}>{countdownText}</div>
          )}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          <h3 style={titleStyle}>{event.title}</h3>
          {event.description && (
            <p style={descriptionStyle}>{event.description}</p>
          )}
          {variant === "upcoming" && event.scheduled_at && (
            <div style={dateRowStyle}>
              <Calendar size={13} color="var(--gold, #c9a84c)" />
              <span>{formatScheduledDate(event.scheduled_at)}</span>
            </div>
          )}
        </div>
      </Link>
    </>
  );
}
