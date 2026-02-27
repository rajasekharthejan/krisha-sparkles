import type { Metadata } from "next";
import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop All Jewelry",
  description: "Browse our complete collection of imitation jewelry — necklaces, earrings, bangles, pendant sets, Jadau jewelry, and more. Free shipping on orders over $75.",
  openGraph: {
    title: "Shop All Jewelry | Krisha Sparkles",
    description: "Handpicked imitation jewelry for every occasion. Necklaces, earrings, bangles, pendant sets, and Jadau jewelry.",
    images: [{ url: "https://shopkrisha.com/logo.png", width: 800, height: 800 }],
  },
};

export default function ShopPage() {
  return <ShopPageClient />;
}
