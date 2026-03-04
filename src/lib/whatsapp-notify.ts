const WA_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_API_BASE = "https://graph.facebook.com/v22.0";

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

// ── Customer: Out for Delivery ──────────────────────────────────────────────
export async function sendWhatsAppOutForDelivery(phone: string, orderRef: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    await sendWAMessage(
      phone,
      `🚚 *Out for Delivery — Krisha Sparkles*\n\n` +
      `Great news! Your order *#${orderRef}* is out for delivery today! 🎉\n\n` +
      `Keep an eye out — your beautiful jewelry will be at your door soon.\n\n` +
      `📍 Track your order:\nhttps://shopkrisha.com/account/orders`
    );
  } catch (err) {
    console.error("WhatsApp out-for-delivery failed:", err);
  }
}

// ── Customer: Delivered ─────────────────────────────────────────────────────
export async function sendWhatsAppDelivered(phone: string, orderRef: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    await sendWAMessage(
      phone,
      `✅ *Order Delivered — Krisha Sparkles*\n\n` +
      `Your order *#${orderRef}* has been delivered! 🎊\n\n` +
      `We hope you love your jewelry! ✨\n\n` +
      `💬 We'd love to hear from you — leave a review and share your sparkle:\nhttps://shopkrisha.com/account/orders\n\n` +
      `Questions or issues? Reply to this message anytime.`
    );
  } catch (err) {
    console.error("WhatsApp delivered notification failed:", err);
  }
}

// ── Customer: Label Created ─────────────────────────────────────────────────
export async function sendWhatsAppLabelCreated(phone: string, orderRef: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    await sendWAMessage(
      phone,
      `📋 *Shipping Label Created — Krisha Sparkles*\n\n` +
      `Your order *#${orderRef}* is being prepared for shipping! We've created the shipping label.\n\n` +
      `You'll receive a tracking update once your package is picked up by the carrier.\n\n` +
      `📍 Track your order:\nhttps://shopkrisha.com/account/orders`
    );
  } catch (err) {
    console.error("WhatsApp label-created notification failed:", err);
  }
}

// ── Customer: In Transit ────────────────────────────────────────────────────
export async function sendWhatsAppInTransit(phone: string, orderRef: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    await sendWAMessage(
      phone,
      `🚚 *Package In Transit — Krisha Sparkles*\n\n` +
      `Your order *#${orderRef}* is on the move! It's been picked up by the carrier and is heading your way.\n\n` +
      `📍 Track your order:\nhttps://shopkrisha.com/account/orders`
    );
  } catch (err) {
    console.error("WhatsApp in-transit notification failed:", err);
  }
}

// ── Customer: Order Cancelled ───────────────────────────────────────────────
export async function sendWhatsAppCancelled(phone: string, orderRef: string): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    await sendWAMessage(
      phone,
      `❌ *Order Cancelled — Krisha Sparkles*\n\n` +
      `Your order *#${orderRef}* has been cancelled.\n\n` +
      `If a refund is applicable, it will be processed within 5–10 business days back to your original payment method.\n\n` +
      `Questions? Reply to this message or email hello@shopkrisha.com`
    );
  } catch (err) {
    console.error("WhatsApp cancellation notification failed:", err);
  }
}

// ── Customer: Refund Update ─────────────────────────────────────────────────
export async function sendWhatsAppRefundUpdate(
  phone: string,
  orderRef: string,
  status: "approved" | "denied",
  adminNotes?: string | null
): Promise<void> {
  if (!WA_TOKEN || !WA_PHONE_ID) return;
  try {
    const isApproved = status === "approved";
    const emoji = isApproved ? "💚" : "⚠️";
    const statusText = isApproved ? "Approved" : "Denied";
    const details = isApproved
      ? `Your refund has been approved and will be processed within 5–10 business days back to your original payment method.`
      : `Unfortunately, your refund request has been denied.${adminNotes ? `\n\n📝 Reason: ${adminNotes}` : ""}`;

    await sendWAMessage(
      phone,
      `${emoji} *Refund ${statusText} — Krisha Sparkles*\n\n` +
      `Order *#${orderRef}*\n\n` +
      `${details}\n\n` +
      `Questions? Reply to this message or email hello@shopkrisha.com`
    );
  } catch (err) {
    console.error("WhatsApp refund update failed:", err);
  }
}
