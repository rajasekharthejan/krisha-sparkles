"use client";

import { useMemo } from "react";
import { Radio, RotateCcw, Clock } from "lucide-react";

interface LiveVideoPlayerProps {
  videoUrl: string;
  status: "scheduled" | "live" | "ended";
  thumbnail?: string | null;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function LiveVideoPlayer({
  videoUrl,
  status,
  thumbnail,
}: LiveVideoPlayerProps) {
  const youtubeId = useMemo(
    () => (videoUrl ? extractYouTubeId(videoUrl) : null),
    [videoUrl]
  );

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%", // 16:9 aspect ratio
    borderRadius: "12px",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    overflow: "hidden",
    background: "var(--surface, #141414)",
  };

  const iframeWrapperStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  };

  const iframeStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    border: "none",
  };

  const thumbnailStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const placeholderStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    background:
      "linear-gradient(135deg, var(--surface, #141414), var(--bg, #0a0a0a))",
  };

  const badgeBaseStyle: React.CSSProperties = {
    position: "absolute",
    top: "12px",
    left: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    zIndex: 10,
  };

  const liveBadgeStyle: React.CSSProperties = {
    ...badgeBaseStyle,
    background: "#e53e3e",
    color: "#ffffff",
  };

  const replayBadgeStyle: React.CSSProperties = {
    ...badgeBaseStyle,
    background: "rgba(201, 168, 76, 0.9)",
    color: "var(--bg, #0a0a0a)",
  };

  const scheduledBadgeStyle: React.CSSProperties = {
    ...badgeBaseStyle,
    background: "rgba(201, 168, 76, 0.2)",
    color: "var(--gold, #c9a84c)",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
  };

  const dotStyle: React.CSSProperties = {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ffffff",
    animation: "livePulse 1.5s ease-in-out infinite",
  };

  // Scheduled status: show thumbnail placeholder
  if (status === "scheduled") {
    return (
      <>
        <style>{`
          @keyframes livePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
        <div style={containerStyle}>
          <div style={scheduledBadgeStyle}>
            <Clock size={14} />
            <span>Scheduled</span>
          </div>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="Scheduled event"
              style={thumbnailStyle}
            />
          ) : null}
          <div style={placeholderStyle}>
            <Clock size={48} color="var(--gold, #c9a84c)" />
            <p
              style={{
                color: "var(--muted, #888)",
                fontSize: "14px",
                fontFamily: "var(--font-playfair, serif)",
              }}
            >
              Stream starts soon
            </p>
          </div>
        </div>
      </>
    );
  }

  // Build iframe src
  let iframeSrc = "";
  if (youtubeId) {
    const params = new URLSearchParams({
      autoplay: status === "live" ? "1" : "0",
      mute: status === "live" ? "1" : "0",
      rel: "0",
      modestbranding: "1",
    });
    iframeSrc = `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  } else if (videoUrl) {
    iframeSrc = videoUrl;
  }

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={containerStyle}>
        {/* Status badge */}
        {status === "live" && (
          <div style={liveBadgeStyle}>
            <span style={dotStyle} />
            <Radio size={14} />
            <span>LIVE</span>
          </div>
        )}
        {status === "ended" && (
          <div style={replayBadgeStyle}>
            <RotateCcw size={14} />
            <span>Replay</span>
          </div>
        )}

        {/* Video iframe */}
        <div style={iframeWrapperStyle}>
          {iframeSrc ? (
            <iframe
              src={iframeSrc}
              style={iframeStyle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Live video player"
            />
          ) : (
            <div style={placeholderStyle}>
              <Radio size={48} color="var(--gold, #c9a84c)" />
              <p
                style={{
                  color: "var(--muted, #888)",
                  fontSize: "14px",
                }}
              >
                Video unavailable
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
