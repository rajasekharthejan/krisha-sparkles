"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, LogIn } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthStore } from "@/store/authStore";
import type { LiveEventMessage } from "@/types";
import Link from "next/link";

interface LiveChatProps {
  eventSlug: string;
  eventId: string;
  isLive: boolean;
}

export default function LiveChat({ eventSlug, eventId, isLive }: LiveChatProps) {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<LiveEventMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch initial chat history
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/live-events/${eventSlug}/chat`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchMessages();
  }, [eventSlug]);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`live-chat-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_event_messages",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const newMsg = payload.new as LiveEventMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !user) return;

    setSending(true);
    try {
      const res = await fetch(`/api/live-events/${eventSlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage("");
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--surface, #141414)",
    borderRadius: "12px",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "14px 20px",
    borderBottom: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    background: "var(--elevated, #1a1a1a)",
    fontSize: "16px",
    fontWeight: 700,
    color: "var(--gold, #c9a84c)",
    fontFamily: "var(--font-playfair, serif)",
  };

  const messagesContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minHeight: "200px",
  };

  const messageRowStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  };

  const userNameStyle: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: 700,
    color: "var(--gold, #c9a84c)",
  };

  const messageTextStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text, #f5f5f5)",
    lineHeight: 1.4,
    wordBreak: "break-word",
  };

  const timeStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "var(--muted, #888)",
    marginTop: "2px",
  };

  const formStyle: React.CSSProperties = {
    display: "flex",
    gap: "8px",
    padding: "12px 16px",
    borderTop: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    background: "var(--elevated, #1a1a1a)",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: "8px 12px",
    fontSize: "13px",
    color: "var(--text, #f5f5f5)",
    background: "var(--bg, #0a0a0a)",
    border: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    borderRadius: "8px",
    outline: "none",
  };

  const sendBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "var(--gold, #c9a84c)",
    color: "var(--bg, #0a0a0a)",
    border: "none",
    borderRadius: "8px",
    cursor: sending ? "not-allowed" : "pointer",
    opacity: sending ? 0.6 : 1,
    transition: "opacity 0.2s ease",
    flexShrink: 0,
  };

  const signInStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    borderTop: "1px solid var(--gold-border, rgba(201,168,76,0.3))",
    background: "var(--elevated, #1a1a1a)",
    fontSize: "13px",
    color: "var(--muted, #888)",
  };

  const signInLinkStyle: React.CSSProperties = {
    color: "var(--gold, #c9a84c)",
    textDecoration: "none",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    color: "var(--muted, #888)",
    fontSize: "13px",
  };

  const emptyStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "40px 20px",
    color: "var(--muted, #888)",
    fontSize: "13px",
    textAlign: "center",
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <MessageCircle size={18} />
        Live Chat
        {isLive && (
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#48bb78",
              marginLeft: "4px",
            }}
          />
        )}
      </div>

      <div style={messagesContainerStyle} ref={containerRef}>
        {loading ? (
          <div style={loadingStyle}>Loading chat...</div>
        ) : messages.length === 0 ? (
          <div style={emptyStyle}>
            <MessageCircle size={24} />
            <p>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={messageRowStyle}>
              <span style={userNameStyle}>{msg.user_name}</span>
              <span style={messageTextStyle}>{msg.message}</span>
              <span style={timeStyle}>{formatTime(msg.created_at)}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {user ? (
        <form style={formStyle} onSubmit={handleSend}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isLive ? "Say something..." : "Chat is view-only"}
            disabled={!isLive}
            style={{
              ...inputStyle,
              opacity: isLive ? 1 : 0.5,
            }}
            maxLength={500}
          />
          <button
            type="submit"
            style={sendBtnStyle}
            disabled={sending || !isLive || !newMessage.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div style={signInStyle}>
          <Link href="/auth/login" style={signInLinkStyle}>
            <LogIn size={14} />
            Sign in to chat
          </Link>
        </div>
      )}
    </div>
  );
}
