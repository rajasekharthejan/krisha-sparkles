import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

/** Single source of truth for the app version — used in admin sidebar + store footer */
export const APP_VERSION = "v10.1";

// ── Product metadata filter options ──────────────────────────────────────────
export const MATERIALS = ["Gold Plated", "Silver Plated", "Kundan", "Meenakari", "Pearl", "Oxidized", "Temple"];
export const COLORS = ["Gold", "Silver", "Rose Gold", "Multi", "Green", "Red", "White", "Pink"];
export const OCCASIONS = ["Wedding", "Party", "Daily Wear", "Festival", "Bridal", "Casual", "Office"];
export const STYLES = ["Traditional", "Modern", "Fusion", "Statement", "Minimalist", "Boho", "Classic"];

export const CATEGORIES = [
  { name: "Necklaces", slug: "necklaces", icon: "💎" },
  { name: "Earrings", slug: "earrings", icon: "✨" },
  { name: "Bangles & Bracelets", slug: "bangles-bracelets", icon: "📿" },
  { name: "Pendant Sets", slug: "pendant-sets", icon: "🏅" },
  { name: "Jadau Jewelry", slug: "jadau-jewelry", icon: "👑" },
  { name: "Hair Accessories", slug: "hair-accessories", icon: "🌺" },
  { name: "Dresses", slug: "dresses", icon: "👗" },
];
