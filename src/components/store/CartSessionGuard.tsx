"use client";

/**
 * CartSessionGuard
 * Listens to Supabase auth state changes and clears the cart automatically
 * when the user signs out (explicit logout, session expiry, or another-tab logout).
 *
 * This ensures the cart is session-specific and never shows stale items
 * from a previous user's session when a new visitor opens the site.
 */

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

export default function CartSessionGuard() {
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearCart();
      }
    });

    return () => subscription.unsubscribe();
  }, [clearCart]);

  return null;
}
