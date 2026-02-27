"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { trackEvent } from "@/lib/trackEvent";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  cartUpdatedAt: number;
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { quantity?: number; selectedVariant?: string }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      cartUpdatedAt: Date.now(),

      addItem: (item) => {
        // Generate composite key: productId__selectedVariant (or just productId for no-variant items)
        const compositeId = item.selectedVariant
          ? `${item.productId}__${item.selectedVariant}`
          : item.productId;

        set((state) => {
          const existing = state.items.find((i) => i.id === compositeId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === compositeId
                  ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                  : i
              ),
              cartUpdatedAt: Date.now(),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                id: compositeId,
                quantity: item.quantity ?? 1,
                selectedVariant: item.selectedVariant,
              },
            ],
            cartUpdatedAt: Date.now(),
          };
        });

        // Consent-gated AddToCart — no-op on iOS WKWebView (Apple 5.1.2)
        trackEvent("AddToCart", {
          value: item.price,
          currency: "USD",
          content_ids: [item.productId],
          content_id: item.productId,
          content_name: item.name,
          content_type: "product",
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          cartUpdatedAt: Date.now(),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          cartUpdatedAt: Date.now(),
        }));
      },

      clearCart: () => set({ items: [], cartUpdatedAt: Date.now() }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "krisha-cart",
      partialize: (state) => ({ items: state.items, cartUpdatedAt: state.cartUpdatedAt }),
    }
  )
);
