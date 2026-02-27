const WA_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_API_BASE = "https://graph.facebook.com/v17.0";

// Admin numbers to notify on every new order
const ADMIN_WA_NUMBERS = [
  process.env.ADMIN_WA_NUMBER_1 || "16825835389",   // +1 682-583-5389
  process.env.ADMIN_WA_NUMBER_2 || "18607811479",   // +1 860-781-1479
];

function formatPhone(phone: string): string {
  // Remove all non-digits, ensure it starts with country code
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return digits;
  if (digits.length === 10) return "1" + digits; // assume US
  return digits;
}

async function sendWAMessage(to: string, bodyText: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  await fetch(`${WA_API_BASE}/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${WA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: formatPhone(to),
      type: "text",
      text: { body: bodyText },
    }),
  });
}

// ── Admin: New Order Alert ─────────────────────────────────────────────────
// Sent to BOTH admin numbers on every new order.
export async function notifyAdminNewOrder(params: {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: { product_name: string; quantity: number; price: number }[];
  shippingCity?: string;
  shippingState?: string;
}): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.log("[WhatsApp] Skipped — WHATSAPP_BUSINESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set");
    return;
  }

  const { orderRef, customerName, customerEmail, total, items, shippingCity, shippingState } = params;
  const location = [shippingCity, shippingState].filter(Boolean).join(", ");

  const itemLines = items
    .map((i) => `  • ${i.product_name} ×${i.quantity} — $${(i.price * i.quantity).toFixed(2)}`)
    .join("\n");

  const message =
    `🛍️ *NEW ORDER — Krisha Sparkles*\n\n` +
    `*Order #${orderRef}*\n` +
    `💰 Total: *$${total.toFixed(2)}*\n\n` +
    `👤 Customer: ${customerName}\n` +
    `📧 Email: ${customerEmail}\n` +
    (location ? `📍 Ships to: ${location}\n` : "") +
    `\n📦 Items:\n${itemLines}\n\n` +
    `🔗 https://shopkrisha.com/admin/orders`;

  for (const adminNumber of ADMIN_WA_NUMBERS) {
    try {
      await sendWAMessage(adminNumber, message);
      console.log(`[WhatsApp] Admin notified: ${adminNumber}`);
    } catch (err) {
      console.error(`[WhatsApp] Failed to notify admin ${adminNumber}:`, err);
    }
  }
}

// ── Customer: Order Confirmation ───────────────────────────────────────────
export async function sendWhatsAppOrderConfirmation(phone: string, orderRef: string, total: number): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    const formattedPhone = formatPhone(phone);
    await fetch(`${WA_API_BASE}/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body:
            `✨ *Order Confirmed — Krisha Sparkles*\n\n` +
            `Hi! Your order *#${orderRef}* for *$${total.toFixed(2)}* has been confirmed! 🎉\n\n` +
            `We'll ship your jewelry within 2–3 business days. You'll receive a tracking update when it ships.\n\n` +
            `Questions? Reply to this message anytime.\n` +
            `🛍️ https://shopkrisha.com/account/orders`,
        },
      }),
    });
  } catch (err) {
    console.error("WhatsApp order confirmation failed:", err);
  }
}

// ── Customer: Shipping Update ──────────────────────────────────────────────
export async function sendWhatsAppShippingUpdate(phone: string, orderRef: string, trackingNumber: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    const formattedPhone = formatPhone(phone);
    await fetch(`${WA_API_BASE}/${WA_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body:
            `📦 *Your order has shipped — Krisha Sparkles*\n\n` +
            `Order *#${orderRef}* is on its way!\n\n` +
            `🔍 Tracking: *${trackingNumber}*\n\n` +
            `Standard delivery: 5–8 business days. Track your package anytime at:\n` +
            `https://shopkrisha.com/account/orders`,
        },
      }),
    });
  } catch (err) {
    console.error("WhatsApp shipping update failed:", err);
  }
}
