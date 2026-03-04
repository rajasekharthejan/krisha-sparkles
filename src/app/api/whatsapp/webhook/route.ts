import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "krisha_sparkles_wa_verify_2026";

// ── GET: Meta Webhook Verification ──────────────────────────────────────────
// Meta sends a GET with hub.mode, hub.verify_token, hub.challenge
// We must return the challenge if the token matches
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Verification failed — token mismatch");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ── POST: Incoming Messages / Status Updates ────────────────────────────────
// Meta sends message delivery statuses and incoming customer messages here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log for debugging (remove in production if noisy)
    console.log("[WhatsApp Webhook] Received:", JSON.stringify(body).slice(0, 500));

    // Extract status updates (delivery receipts)
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const statuses = change?.value?.statuses ?? [];
        for (const status of statuses) {
          // status.status can be: "sent", "delivered", "read", "failed"
          // status.id is the WhatsApp message ID
          // We could update whatsapp_logs here in the future
          console.log(`[WhatsApp Status] ${status.id}: ${status.status}`);
        }
      }
    }
  } catch (err) {
    console.error("[WhatsApp Webhook] Error processing:", err);
  }

  // Always return 200 — Meta retries on non-200 responses
  return NextResponse.json({ status: "ok" });
}
