"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function AbandonedCartTracker() {
  const { items } = useCartStore();
  const { user } = useAuthStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (items.length === 0) {
      // Cart cleared — mark as recovered
      fetch("/api/abandoned-cart/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      }).catch(() => {});
      return;
    }

    // Debounce 3 seconds before tracking
    debounceRef.current = setTimeout(() => {
      const cartSnapshot = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        slug: item.slug,
      }));

      fetch("/api/abandoned-cart/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ cart_snapshot: cartSnapshot }),
      }).catch(() => {});
    }, 3000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [items, user]);

  return null;
}
