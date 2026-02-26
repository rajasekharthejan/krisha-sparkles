"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCartStore();
  const total = totalPrice();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="cart-overlay"
        onClick={closeCart}
        style={{ animation: "fadeIn 0.25s ease" }}
      />

      {/* Drawer */}
      <div
        className="cart-drawer"
        style={{ animation: "slideInRight 0.35s ease" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.5rem",
            borderBottom: "1px solid var(--gold-border)",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--gold)",
              }}
            >
              Your Cart
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            onClick={closeCart}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                padding: "3rem 0",
                gap: "1rem",
              }}
            >
              <div style={{ color: "var(--subtle)", opacity: 0.5 }}>
                <ShoppingBag size={56} strokeWidth={1} />
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center" }}>
                Your cart is empty
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="btn-gold"
                style={{ fontSize: "0.8rem", padding: "0.6rem 1.5rem" }}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    padding: "0.75rem",
                    background: "var(--elevated)",
                    borderRadius: "10px",
                    border: "1px solid rgba(201,168,76,0.08)",
                    animation: "slideUp 0.3s ease",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "var(--surface)",
                    }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={72}
                        height={72}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                        }}
                      >
                        💎
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.name}
                    </p>
                    {item.selectedVariant && (
                      <p style={{ fontSize: "0.72rem", color: "var(--subtle)", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.selectedVariant}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--gold)",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {formatPrice(item.price)}
                    </p>

                    {/* Qty Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: "1px solid var(--gold-border)",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--gold)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: "0.875rem", minWidth: "1.5rem", textAlign: "center", color: "var(--text)" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: "1px solid var(--gold-border)",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--gold)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s",
                        }}
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          marginLeft: "auto",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--subtle)",
                          display: "flex",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--subtle)")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            style={{
              padding: "1.5rem",
              borderTop: "1px solid var(--gold-border)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Subtotal</span>
              <span
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--gold)",
                }}
              >
                {formatPrice(total)}
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--subtle)", textAlign: "center" }}>
              Shipping & taxes calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn-gold"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Proceed to Checkout
            </Link>
            <button
              onClick={closeCart}
              className="btn-gold-outline"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
