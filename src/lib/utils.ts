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

export const CATEGORIES = [
  { name: "Necklaces", slug: "necklaces", icon: "💎" },
  { name: "Earrings", slug: "earrings", icon: "✨" },
  { name: "Bangles & Bracelets", slug: "bangles-bracelets", icon: "📿" },
  { name: "Pendant Sets", slug: "pendant-sets", icon: "🏅" },
  { name: "Jadau Jewelry", slug: "jadau-jewelry", icon: "👑" },
  { name: "Hair Accessories", slug: "hair-accessories", icon: "🌺" },
  { name: "Dresses", slug: "dresses", icon: "👗" },
];
