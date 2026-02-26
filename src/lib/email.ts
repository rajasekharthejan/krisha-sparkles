import { Resend } from "resend";
import type { Order } from "@/types";

const FROM = process.env.RESEND_FROM_EMAIL || "noreply@krishasparkles.com";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ── Order Confirmation ─────────────────────────────────────────────────────

export async function sendOrderConfirmation(order: Order) {
  const resend = getResend();
  if (!resend) return;

  const itemRows = (order.order_items || [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;">${item.product_name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;text-align:right;color:#c9a84c;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`
    )
    .join("");

  const addr = order.shipping_address;
  const addrText = addr
    ? `${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}, ${addr.city}, ${addr.state} ${addr.postal_code}`
    : "—";

  await resend.emails.send({
    from: `Krisha Sparkles <${FROM}>`,
    to: order.email,
    subject: `Order Confirmed ✨ #${order.id.slice(-8).toUpperCase()}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:28px;font-weight:700;color:#c9a84c;margin:0;">✦ Krisha Sparkles</p>
      <p style="color:#888;margin:8px 0 0;font-size:13px;">Exquisite Imitation Jewelry</p>
    </div>

    <!-- Confirmation -->
    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:28px;margin-bottom:24px;text-align:center;">
      <p style="font-size:40px;margin:0 0 8px;">🎉</p>
      <h1 style="font-size:22px;font-weight:700;color:#c9a84c;margin:0 0 8px;">Order Confirmed!</h1>
      <p style="color:#888;margin:0;">Hi ${order.name}, thank you for your order. We'll get it shipped out soon!</p>
    </div>

    <!-- Order Details -->
    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <div style="padding:16px 20px;border-bottom:1px solid rgba(201,168,76,0.15);">
        <p style="font-size:13px;font-weight:700;color:#c9a84c;margin:0;text-transform:uppercase;letter-spacing:0.08em;">Order Details</p>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#0a0a0a;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Item</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <div style="padding:16px 20px;border-top:1px solid rgba(201,168,76,0.15);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#888;font-size:14px;">Subtotal</span>
          <span style="font-size:14px;">${formatPrice(order.subtotal)}</span>
        </div>
        ${order.tax > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#888;font-size:14px;">Tax</span><span style="font-size:14px;">${formatPrice(order.tax)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;">
          <span style="font-weight:700;font-size:15px;">Total</span>
          <span style="font-weight:700;font-size:15px;color:#c9a84c;">${formatPrice(order.total)}</span>
        </div>
      </div>
    </div>

    <!-- Shipping -->
    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-size:13px;font-weight:700;color:#c9a84c;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.08em;">Shipping To</p>
      <p style="color:#888;margin:0;font-size:14px;line-height:1.6;">${addrText}</p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="color:#888;font-size:13px;margin:0 0 8px;">Questions? Reply to this email or visit</p>
      <a href="https://krisha-sparkles.vercel.app/contact" style="color:#c9a84c;font-size:13px;text-decoration:none;">krishasparkles.com/contact</a>
      <p style="color:#444;font-size:11px;margin:16px 0 0;">© 2025 Krisha Sparkles LLC · Texas, USA</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ── Refund Status ──────────────────────────────────────────────────────────

export async function sendRefundStatusEmail(params: {
  email: string;
  name?: string;
  orderId: string;
  status: "approved" | "denied";
  adminNotes?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const { email, name, orderId, status, adminNotes } = params;
  const approved = status === "approved";

  await resend.emails.send({
    from: `Krisha Sparkles <${FROM}>`,
    to: email,
    subject: approved
      ? "Your Refund Has Been Approved ✅"
      : "Update on Your Refund Request",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:28px;font-weight:700;color:#c9a84c;margin:0;">✦ Krisha Sparkles</p>
    </div>

    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <p style="font-size:40px;margin:0 0 8px;">${approved ? "✅" : "📋"}</p>
      <h1 style="font-size:22px;font-weight:700;color:${approved ? "#10b981" : "#f59e0b"};margin:0 0 8px;">
        ${approved ? "Refund Approved" : "Refund Request Update"}
      </h1>
      <p style="color:#888;margin:0;font-size:14px;line-height:1.6;">
        ${name ? `Hi ${name}, ` : ""}your refund request for order <strong style="color:#f5f5f5;">#${orderId.slice(-8).toUpperCase()}</strong> has been ${approved ? "approved" : "reviewed"}.
      </p>
    </div>

    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-size:13px;font-weight:700;color:#c9a84c;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">Status</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0;">
        ${
          approved
            ? "Your refund has been approved and will be processed within 3–5 business days back to your original payment method."
            : "After reviewing your request, we were unable to approve the refund at this time."
        }
      </p>
      ${
        adminNotes
          ? `<div style="margin-top:12px;padding:12px;background:#0a0a0a;border-radius:8px;border-left:3px solid rgba(201,168,76,0.4);">
              <p style="font-size:13px;color:#888;margin:0;font-style:italic;">"${adminNotes}"</p>
            </div>`
          : ""
      }
    </div>

    <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="color:#888;font-size:13px;margin:0 0 8px;">Have questions? We're here to help.</p>
      <a href="https://krisha-sparkles.vercel.app/contact" style="color:#c9a84c;font-size:13px;text-decoration:none;">Contact Support</a>
      <p style="color:#444;font-size:11px;margin:16px 0 0;">© 2025 Krisha Sparkles LLC · Texas, USA</p>
    </div>
  </div>
</body>
</html>`,
  });
}

// ── Shipping Notification ──────────────────────────────────────────────────

export async function sendShippingNotification(params: {
  email: string;
  name: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string | null;
}) {
  const resend = getResend();
  if (!resend) return;

  const { email, name, orderId, trackingNumber, trackingUrl } = params;

  await resend.emails.send({
    from: `Krisha Sparkles <${FROM}>`,
    to: email,
    subject: `Your Order Has Shipped! 📦`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#f5f5f5;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:28px;font-weight:700;color:#c9a84c;margin:0;">✦ Krisha Sparkles</p>
    </div>

    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:28px;text-align:center;margin-bottom:24px;">
      <p style="font-size:40px;margin:0 0 8px;">📦</p>
      <h1 style="font-size:22px;font-weight:700;color:#c9a84c;margin:0 0 8px;">Your Order is on the Way!</h1>
      <p style="color:#888;margin:0;font-size:14px;">Hi ${name}, your order #${orderId.slice(-8).toUpperCase()} has shipped!</p>
    </div>

    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="font-size:13px;font-weight:700;color:#c9a84c;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">Tracking Information</p>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <p style="font-size:12px;color:#888;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.06em;">Tracking Number</p>
          <p style="font-family:monospace;font-size:16px;font-weight:700;color:#f5f5f5;margin:0;letter-spacing:0.05em;">${trackingNumber}</p>
        </div>
        ${
          trackingUrl
            ? `<a href="${trackingUrl}" style="display:inline-block;padding:10px 20px;background:#c9a84c;color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:13px;">Track Package →</a>`
            : ""
        }
      </div>
    </div>

    <div style="background:#111;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0;">
        📍 Standard delivery typically takes <strong style="color:#f5f5f5;">5–8 business days</strong>. You can also track your order anytime from your account.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="https://krisha-sparkles.vercel.app/account/orders" style="display:inline-block;padding:12px 24px;border:1px solid rgba(201,168,76,0.4);color:#c9a84c;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        View Order in Account →
      </a>
    </div>

    <div style="text-align:center;padding:24px 0;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="color:#888;font-size:13px;margin:0 0 8px;">Need help? We're always here.</p>
      <a href="https://krisha-sparkles.vercel.app/contact" style="color:#c9a84c;font-size:13px;text-decoration:none;">Contact Support</a>
      <p style="color:#444;font-size:11px;margin:16px 0 0;">© 2025 Krisha Sparkles LLC · Texas, USA</p>
    </div>
  </div>
</body>
</html>`,
  });
}
