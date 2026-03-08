"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { LiveEvent } from "@/types";
import LiveVideoPlayer from "@/components/store/LiveVideoPlayer";
import LiveProductSidebar from "@/components/store/LiveProductSidebar";
import LiveChat from "@/components/store/LiveChat";
import LiveViewerCount from "@/components/store/LiveViewerCount";
import LiveCountdown from "@/components/store/LiveCountdown";
import LiveDiscountBanner from "@/components/store/LiveDiscountBanner";

interface Props {
  event: LiveEvent;
}

export default function LiveEventClient({ event }: Props) {
  const isLive = event.status === "live";
  const isScheduled = event.status === "scheduled";
  const products = event.live_event_products || [];

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Top bar */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--gold-border)",
          padding: "0.75rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/live"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "var(--muted)",
              textDecoration: "none",
              fontSize: "0.85rem",
              transition: "color 0.2s",
            }}
          >
            <ArrowLeft size={16} /> All Events
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isLive && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  background: "rgba(239,68,68,0.12)",
                  color: "#ef4444",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    animation: "pulseLive 1.5s ease-in-out infinite",
                  }}
                />
                LIVE
              </span>
            )}
            {isLive && <LiveViewerCount eventId={event.id} />}
          </div>
        </div>
      </div>

      {/* Discount banner */}
      {event.discount_code && (
        <LiveDiscountBanner code={event.discount_code} label={event.discount_label} />
      )}

      {/* Main Content */}
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
        {/* Event Title */}
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 700,
            marginBottom: "0.5rem",
          }}
        >
          {event.title}
        </h1>
        {event.description && (
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            {event.description}
          </p>
        )}

        {/* Countdown for scheduled events */}
        {isScheduled && event.scheduled_at && (
          <div style={{ marginBottom: "2rem" }}>
            <LiveCountdown scheduledAt={event.scheduled_at} />
          </div>
        )}

        {/* Video + Sidebar + Chat Grid */}
        <div
          className="live-event-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Left: Video */}
          <div>
            <LiveVideoPlayer
              videoUrl={event.video_url || ""}
              status={event.status}
              thumbnail={event.thumbnail}
            />

            {/* Chat below video on desktop */}
            <div style={{ marginTop: "1.5rem" }}>
              <LiveChat eventSlug={event.slug} eventId={event.id} isLive={isLive} />
            </div>
          </div>

          {/* Right: Product Sidebar */}
          <div>
            {products.length > 0 && (
              <LiveProductSidebar products={products} eventTitle={event.title} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .live-event-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
