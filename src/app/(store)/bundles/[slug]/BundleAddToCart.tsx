"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Check } from "lucide-react";

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface BundleItem {
  id: string;
  product_id: string;
  products: BundleProduct;
}

interface BundleAddToCartProps {
  bundleName: string;
  bundlePrice: number;
  items: BundleItem[];
}

export default function BundleAddToCart({
  bundleName,
  bundlePrice,
  items,
}: BundleAddToCartProps) {
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addItem, openCart } = useCartStore();

  async function handleAddToCart() {
    if (loading || added) return;
    setLoading(true);

    // Calculate per-item price proportionally based on original prices,
    // but show total as bundlePrice. We distribute bundle price proportionally.
    const totalOriginal = items.reduce((sum, item) => sum + item.products.price, 0);

    for (const item of items) {
      const product = item.products;
      // Proportional price: each item gets a share of the bundle price
      const proportion = totalOriginal > 0 ? product.price / totalOriginal : 1 / items.length;
      const itemPrice = Math.round(bundlePrice * proportion * 100) / 100;

      addItem({
        productId: product.id,
        name: product.name,
        price: itemPrice,
        image: product.images?.[0] || "",
        slug: product.slug,
        quantity: 1,
        selectedVariant: `Bundle: ${bundleName}`,
      });
    }

    setLoading(false);
    setAdded(true);
    openCart();

    // Reset after 3 seconds
    setTimeout(() => setAdded(false), 3000);
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || added}
      className={added ? "btn-gold-outline" : "btn-gold"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.6rem",
        fontSize: "1rem",
        padding: "0.85rem 2rem",
        width: "100%",
        justifyContent: "center",
        transition: "all 0.2s",
        cursor: loading ? "wait" : added ? "default" : "pointer",
      }}
    >
      {added ? (
        <>
          <Check size={18} />
          Added to Cart!
        </>
      ) : (
        <>
          <ShoppingBag size={18} />
          {loading ? "Adding..." : "Add Bundle to Cart"}
        </>
      )}
    </button>
  );
}
