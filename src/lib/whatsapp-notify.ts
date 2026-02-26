const WA_TOKEN = process.env.WHATSAPP_BUSINESS_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_API_BASE = "https://graph.facebook.com/v17.0";

function formatPhone(phone: string): string {
  // Remove all non-digits, ensure it starts with country code
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return digits;
  if (digits.length === 10) return "1" + digits; // assume US
  return digits;
}

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
        type: "template",
        template: {
          name: "order_confirmation",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: orderRef },
                { type: "currency", currency: { fallback_value: `$${total.toFixed(2)}`, code: "USD", amount_1000: Math.round(total * 1000) } },
              ]
            }
          ]
        }
      }),
    });
  } catch (err) {
    console.error("WhatsApp order confirmation failed:", err);
  }
}

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
        type: "template",
        template: {
          name: "shipping_update",
          language: { code: "en_US" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: orderRef },
                { type: "text", text: trackingNumber },
              ]
            }
          ]
        }
      }),
    });
  } catch (err) {
    console.error("WhatsApp shipping update failed:", err);
  }
}
