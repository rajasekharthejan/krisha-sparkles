export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  created_at: string;
}

// ── Phase 4 — Product Variants ─────────────────────────────────────────────
export interface ProductVariant {
  name: string;    // e.g. "Color", "Size"
  options: string[]; // e.g. ["Gold", "Silver", "Rose Gold"]
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  category_id?: string;
  category?: Category;
  images: string[];
  stock_quantity: number;
  featured: boolean;
  active: boolean;
  variants?: ProductVariant[];
  /** Per-variant stock map: key = option values joined by "-" in variant order.
   *  e.g. {"40": 1, "44": 1}  or  {"40-Red": 0, "44-Blue": 1}
   *  When empty / missing, fall back to stock_quantity for the whole product. */
  variant_stock?: Record<string, number>;
  tags?: string[];
  material?: string;
  color?: string;
  occasion?: string;
  style?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;           // composite key: productId__selectedVariant
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  selectedVariant?: string; // e.g. "Color: Gold, Size: M"
}

export interface Order {
  id: string;
  email: string;
  name: string;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  subtotal: number;
  tax: number;
  total: number;
  status: "pending" | "paid" | "shipped" | "label_created" | "in_transit" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
  shipping_address?: ShippingAddress;
  notes?: string;
  user_id?: string;
  tracking_number?: string;
  tracking_url?: string;
  label_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  phone?: string;
  notify_whatsapp?: boolean;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ── Phase 3 Types ──────────────────────────────────────────

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  body: string;
  verified_purchase: boolean;
  approved: boolean;
  images?: string[];
  photo_approved?: boolean | null;
  created_at: string;
  user_profiles?: { first_name?: string; last_name?: string };
}

export type RefundStatus = "pending" | "approved" | "denied";
export type RefundReason = "damaged" | "wrong_item" | "not_as_described" | "changed_mind" | "other";

export interface RefundRequest {
  id: string;
  order_id: string;
  user_id: string;
  email: string;
  reason: RefundReason;
  details?: string;
  status: RefundStatus;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  orders?: Pick<Order, "id" | "total" | "status" | "created_at">;
}

// ── Phase 7 — Loyalty Redemption ───────────────────────────────────────────
export interface PointsHistory {
  order_id: string;
  order_short: string;       // last 8 chars uppercase, e.g. "A1B2C3D4"
  points_earned: number;     // Math.floor(order.total) — 1pt per $1 spent
  points_redeemed: number;   // points deducted at this order's checkout (0 if none)
  order_total: number;
  status: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  active: boolean;
  subscribed_at: string;
}

export type ContactSubject = "order_issue" | "return_request" | "product_question" | "general" | "other";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  read: boolean;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  subject: string;
  preview_text?: string | null;
  html_body: string;
  segment: "all" | "buyers" | "non-buyers";
  recipient_count: number;
  sent_at: string;
  created_by: string;
}

// F5: Bundle Builder
export interface ProductBundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  bundle_price: number;
  compare_price: number | null;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  bundle_items?: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  products?: Product;
}

// F6: AI Recommender
export interface Recommendation {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price?: number | null;
  images: string[];
  category_id: string | null;
}

// ── Phase 8 F2 — Photo Reviews & UGC Gallery ─────────────────────────────────
export interface GalleryReview {
  id: string;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  verified_purchase: boolean;
  created_at: string;
  user_profiles?: { first_name?: string };
  products: {
    name: string;
    slug: string;
    images: string[];
    categories?: { slug: string; name: string };
  };
}

export interface ReviewStats {
  product_id: string;
  avg_rating: number;
  review_count: number;
  breakdown: Record<number, number>;
  photo_count: number;
}

// ── Phase 8 F3 — Live Shopping ───────────────────────────────────────────────
export interface LiveEvent {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  video_url?: string | null;
  thumbnail?: string | null;
  status: "scheduled" | "live" | "ended";
  discount_code?: string | null;
  discount_label?: string | null;
  scheduled_at?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  updated_at: string;
  live_event_products?: LiveEventProduct[];
}

export interface LiveEventProduct {
  id: string;
  event_id: string;
  product_id: string;
  display_order: number;
  special_price?: number | null;
  products?: Product;
}

export interface LiveEventMessage {
  id: string;
  event_id: string;
  user_id?: string | null;
  user_name: string;
  message: string;
  created_at: string;
}

// ── Phase 8 F4: Advanced Analytics ───────────────────────────────────────────
export interface CohortRow {
  cohort_month: string;
  period_offset: number;
  customer_count: number;
  total_revenue: number;
}

export interface LtvCustomer {
  email: string;
  name: string;
  total_spent: number;
  order_count: number;
  first_purchase: string;
  last_purchase: string;
  avg_order_value: number;
}

export interface FunnelStep {
  name: string;
  count: number;
  rate: number;
}

export interface CategoryRevenue {
  category_name: string;
  category_id: string;
  total_revenue: number;
  total_units: number;
  order_count: number;
}

// ── Phase 8 F5: A/B Testing ─────────────────────────────────────────────────
export interface Experiment {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  status: "draft" | "active" | "paused" | "completed";
  target_page: string;
  target_component: string;
  traffic_pct: number;
  created_by: string;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  updated_at: string;
  experiment_variants?: ExperimentVariant[];
}

export interface ExperimentVariant {
  id: string;
  experiment_id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
  is_control: boolean;
  created_at: string;
}

export interface ExperimentEvent {
  id: string;
  experiment_id: string;
  variant_id: string;
  event_type: "impression" | "conversion";
  session_id: string;
  revenue?: number | null;
  created_at: string;
}

export interface ExperimentResult {
  variant_id: string;
  variant_name: string;
  is_control: boolean;
  impressions: number;
  conversions: number;
  conversion_rate: number;
  total_revenue: number;
}

// F10: TikTok
export interface TikTokPost {
  id: string;
  video_url: string;
  thumbnail_url: string;
  caption: string | null;
  views_count: number;
  display_order: number;
  active: boolean;
  created_at: string;
}
