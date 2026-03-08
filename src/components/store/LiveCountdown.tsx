"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface LiveCountdownProps {
  scheduledAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function LiveCountdown({ scheduledAt }: LiveCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(scheduledAt)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(scheduledAt);
      setTimeLeft(remaining);
      if (!remaining) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledAt]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "24px",
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--muted, #888)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  const cardsRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  };

  const cardStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    minWidth: "64px",
  };

  const numberCardStyle: React.CSSProperties = {
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--gold, #c9a84c)",
    color: "var(--bg, #0a0a0a)",
    fontSize: "28px",
    fontWeight: 800,
    fontFamily: "var(--font-playfair, serif)",
    borderRadius: "10px",
    fontVariantNumeric: "tabular-nums",
  };

  const unitLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--muted, #888)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const startingSoonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "18px",
    fontWeight: 700,
    color: "var(--gold, #c9a84c)",
    fontFamily: "var(--font-playfair, serif)",
  };

  if (!timeLeft) {
    return (
      <div style={containerStyle}>
        <div style={startingSoonStyle}>
          <Clock size={20} />
          Starting soon...
        </div>
      </div>
    );
  }

  const units: { value: number; label: string }[] = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>
        <Clock size={16} color="var(--gold, #c9a84c)" />
        Starts In
      </div>
      <div style={cardsRowStyle}>
        {units.map((unit) => (
          <div key={unit.label} style={cardStyle}>
            <div style={numberCardStyle}>
              {String(unit.value).padStart(2, "0")}
            </div>
            <span style={unitLabelStyle}>{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
