/**
 * Shippo REST API helper — no SDK, pure fetch.
 * Docs: https://docs.goshippo.com/shippoapi/public-api/
 */

const SHIPPO_BASE = "https://api.goshippo.com";

function headers() {
  const key = process.env.SHIPPO_API_KEY;
  if (!key) throw new Error("SHIPPO_API_KEY is not set");
  return {
    Authorization: `ShippoToken ${key}`,
    "Content-Type": "application/json",
  };
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface ShippoAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;    // 2-letter, e.g. "TX"
  zip: string;
  country: string;  // "US"
  phone?: string;
  email?: string;
  validate?: boolean;
}

export interface ShippoParcel {
  length: string;   // inches
  width: string;
  height: string;
  distance_unit: "in";
  weight: string;   // oz
  mass_unit: "oz";
}

export interface ShippoRate {
  object_id: string;
  carrier_account: string;
  servicelevel: { name: string; token: string };
  provider: string;           // "USPS", "UPS", etc.
  amount: string;             // "6.20"
  currency: string;           // "USD"
  estimated_days: number | null;
  duration_terms?: string;
}

export interface ShippoTransaction {
  object_id: string;
  status: "SUCCESS" | "WAITING" | "QUEUED" | "ERROR";
  tracking_number: string;
  tracking_url_provider: string;
  label_url: string;
  messages: Array<{ text: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────

/** Build the "from" address from env vars */
export function fromAddress(): ShippoAddress {
  return {
    name:    process.env.SHIPPO_FROM_NAME    || "Krisha Sparkles",
    street1: process.env.SHIPPO_FROM_STREET1 || "",
    city:    process.env.SHIPPO_FROM_CITY    || "",
    state:   process.env.SHIPPO_FROM_STATE   || "",
    zip:     process.env.SHIPPO_FROM_ZIP     || "",
    country: "US",
    phone:   process.env.SHIPPO_FROM_PHONE   || "",
    email:   process.env.SHIPPO_FROM_EMAIL   || "",
  };
}

// ── API Calls ─────────────────────────────────────────────────────────────

/**
 * Create a shipment and return available rates.
 * Shippo automatically fetches rates from all connected carriers.
 */
export async function createShipment(
  toAddr: ShippoAddress,
  parcel: ShippoParcel
): Promise<ShippoRate[]> {
  const body = {
    address_from: fromAddress(),
    address_to: toAddr,
    parcels: [parcel],
    async: false, // synchronous — rates in the same response
  };

  const res = await fetch(`${SHIPPO_BASE}/shipments/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = JSON.stringify(data);
    throw new Error(`Shippo shipment error: ${msg}`);
  }

  // Filter out explicitly INVALID rates — test key returns null object_state, which is fine
  const rates: ShippoRate[] = (data.rates || []).filter(
    (r: ShippoRate & { object_state?: string }) => r.object_state !== "INVALID" && r.amount
  );

  if (rates.length === 0) {
    throw new Error("No shipping rates available. Check your from-address configuration.");
  }

  return rates;
}

// ── Tracking ──────────────────────────────────────────────────────────────

export type ShippoTrackingStatusCode =
  | "UNKNOWN" | "PRE_TRANSIT" | "TRANSIT" | "DELIVERED"
  | "RETURNED" | "FAILURE";

export interface ShippoTrackingStatus {
  status: ShippoTrackingStatusCode;
  status_details: string;
  status_date: string | null;
  location?: { city?: string; state?: string; country?: string } | null;
  substatus?: { code?: string; text?: string } | null;
}

/**
 * Detect USPS / UPS / FedEx carrier from the tracking URL Shippo returns.
 * Defaults to "usps" which covers ~95% of domestic shipments.
 */
export function detectCarrier(trackingUrl: string): string {
  const url = (trackingUrl || "").toLowerCase();
  if (url.includes("ups.com"))   return "ups";
  if (url.includes("fedex.com")) return "fedex";
  if (url.includes("dhl.com"))   return "dhl";
  return "usps";
}

/**
 * Query Shippo tracking API for the current status of a shipment.
 * Docs: GET /tracks/{carrier}/{tracking_number}
 * Returns status: UNKNOWN | PRE_TRANSIT | TRANSIT | DELIVERED | RETURNED | FAILURE
 */
export async function getTrackingStatus(
  carrier: string,
  trackingNumber: string
): Promise<ShippoTrackingStatus> {
  const res = await fetch(
    `${SHIPPO_BASE}/tracks/${carrier}/${trackingNumber}`,
    { headers: headers() }
  );
  if (!res.ok) {
    return { status: "UNKNOWN", status_details: "Could not fetch status", status_date: null };
  }
  const data = await res.json();
  const ts = data.tracking_status;
  if (!ts) return { status: "UNKNOWN", status_details: "No tracking info yet", status_date: null };
  return {
    status:         ts.status        || "UNKNOWN",
    status_details: ts.status_details || "",
    status_date:    ts.status_date    || null,
    location:       ts.location       || null,
    substatus:      ts.substatus      || null,
  };
}

/**
 * Purchase a shipping label by rate ID.
 * Returns transaction with tracking number + label PDF URL.
 */
export async function purchaseLabel(rateId: string): Promise<ShippoTransaction> {
  const body = {
    rate: rateId,
    label_file_type: "PDF",
    async: false,
  };

  const res = await fetch(`${SHIPPO_BASE}/transactions/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const data: ShippoTransaction = await res.json();

  if (!res.ok) {
    throw new Error(`Shippo transaction error: ${JSON.stringify(data)}`);
  }

  if (data.status === "ERROR") {
    const msg = data.messages?.map((m) => m.text).join("; ") || "Label purchase failed";
    throw new Error(msg);
  }

  return data;
}
