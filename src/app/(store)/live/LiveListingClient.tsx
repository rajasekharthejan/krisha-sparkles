"use client";

import { Video } from "lucide-react";
import type { LiveEvent } from "@/types";
import LiveEventCard from "@/components/store/LiveEventCard";

interface Props {
  events: LiveEvent[];
}

export default function LiveListingClient({ events }: Props) {
  const live = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "scheduled");
  const ended = events.filter((e) => e.status === "ended").reverse();

  const hasAny = events.length > 0;

  return (
    <div style={{ paddingTop: "80px", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--gold-border)",
          padding: "3rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <span className="badge-gold">
            <Video size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
            Live Shopping
          </span>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              margin: "0.75rem 0 0.25rem",
            }}
          >
            Shop Live Events
          </h1>
          <div className="gold-divider" />
          <p
            style={{
              color: "var(--muted)",
              marginTop: "0.75rem",
              fontSize: "0.9rem",
              maxWidth: "500px",
              margin: "0.75rem auto 0",
            }}
          >
            Watch live, chat with us, and shop exclusive deals on Krisha Sparkles jewelry.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {!hasAny ? (
          /* ── Empty State ─────────────────────────────────────── */
          <div style={{ textAlign: "center", padding: "6rem 0" }}>
            <Video size={48} style={{ color: "var(--subtle)", marginBottom: "1rem" }} />
            <h3
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.5rem",
                color: "var(--text)",
                marginBottom: "0.5rem",
              }}
            >
              No Live Events Yet
            </h3>
            <p style={{ color: "var(--muted)", maxWidth: "400px", margin: "0 auto" }}>
              Stay tuned! We&apos;re planning exciting live shopping events. Follow us on Instagram to
              be the first to know.
            </p>
          </div>
        ) : (
          <>
            {/* ── LIVE NOW ─────────────────────────────────────── */}
            {live.length > 0 && (
              <section style={{ marginBottom: "3rem" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#ef4444",
                      display: "inline-block",
                      animation: "pulseLive 1.5s ease-in-out infinite",
                    }}
                  />
                  Live Now
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {live.map((event) => (
                    <LiveEventCard key={event.id} event={event} variant="live" />
                  ))}
                </div>
              </section>
            )}

            {/* ── Upcoming ─────────────────────────────────────── */}
            {upcoming.length > 0 && (
              <section style={{ marginBottom: "3rem" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                  }}
                >
                  Upcoming Events
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {upcoming.map((event) => (
                    <LiveEventCard key={event.id} event={event} variant="upcoming" />
                  ))}
                </div>
              </section>
            )}

            {/* ── Past / Replays ──────────────────────────────── */}
            {ended.length > 0 && (
              <section style={{ marginBottom: "3rem" }}>
                <h2
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginBottom: "1.25rem",
                    color: "var(--muted)",
                  }}
                >
                  Past Events &amp; Replays
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  {ended.map((event) => (
                    <LiveEventCard key={event.id} event={event} variant="replay" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
