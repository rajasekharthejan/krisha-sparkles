export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
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
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  shipping_address?: ShippingAddress;
  notes?: string;
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
