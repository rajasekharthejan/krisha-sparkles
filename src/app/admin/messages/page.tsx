import { createAdminClient } from "@/lib/supabase/server";
import { MessageCircle } from "lucide-react";
import MessagesTable from "./MessagesTable";
import type { ContactMessage } from "@/types";

export default async function AdminMessagesPage() {
  const supabase = await createAdminClient();

  const { data: messages } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  const allMessages = (messages as ContactMessage[]) || [];
  const unread = allMessages.filter((m) => !m.read).length;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MessageCircle size={22} style={{ color: "var(--gold)" }} /> Messages
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {allMessages.length} total
            {unread > 0 && <> · <span style={{ color: "#f59e0b" }}>{unread} unread</span></>}
          </p>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        <MessagesTable initialMessages={allMessages} />
      </div>
    </div>
  );
}
