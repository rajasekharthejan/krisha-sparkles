import ProductForm from "@/components/admin/ProductForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link
          href="/admin/products"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            color: "var(--muted)",
            textDecoration: "none",
            fontSize: "0.875rem",
            transition: "color 0.2s",
          }}
        >
          <ChevronLeft size={16} />
          Back to Products
        </Link>
        <span style={{ color: "var(--subtle)" }}>›</span>
        <h1
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          Add New Product
        </h1>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
