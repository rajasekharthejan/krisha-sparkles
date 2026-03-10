import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Package, Upload } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Product } from "@/types";
import DeleteProductButton from "./DeleteProductButton";
import ProcessARButton from "@/components/admin/ProcessARButton";

export default async function AdminProductsPage() {
  const supabase = await createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(id,name,slug)")
    .order("created_at", { ascending: false });

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700 }}>
            Products
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {products?.length || 0} products total
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <ProcessARButton />
          <Link href="/admin/products/bulk-upload" className="btn-gold-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <Upload size={16} />
            Bulk Upload
          </Link>
          <Link href="/admin/products/new" className="btn-gold" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={16} />
            Add Product
          </Link>
        </div>
      </div>

      {/* Table */}
      {!products || products.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--gold-border)",
            borderRadius: "12px",
            padding: "4rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Package size={56} style={{ color: "var(--subtle)", opacity: 0.4 }} strokeWidth={1} />
          <h3 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.25rem" }}>No products yet</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Add your first product to get started.</p>
          <Link href="/admin/products/new" className="btn-gold">Add First Product</Link>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(products as Product[]).map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            flexShrink: 0,
                            background: "var(--elevated)",
                            border: "1px solid rgba(201,168,76,0.15)",
                          }}
                        >
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={44}
                              height={44}
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>💎</div>
                          )}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: "0.875rem" }}>{product.name}</p>
                          {product.featured && (
                            <span style={{ fontSize: "0.65rem", color: "var(--gold)", fontWeight: 600, letterSpacing: "0.05em" }}>★ FEATURED</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {product.category?.name || "—"}
                    </td>
                    <td>
                      <div>
                        <span style={{ color: "var(--gold)", fontWeight: 700 }}>{formatPrice(product.price)}</span>
                        {product.compare_price && (
                          <span style={{ fontSize: "0.75rem", color: "var(--subtle)", textDecoration: "line-through", display: "block" }}>
                            {formatPrice(product.compare_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          background: product.stock_quantity === 0
                            ? "rgba(239,68,68,0.1)"
                            : product.stock_quantity <= 5
                            ? "rgba(245,158,11,0.1)"
                            : "rgba(16,185,129,0.1)",
                          color: product.stock_quantity === 0
                            ? "#ef4444"
                            : product.stock_quantity <= 5
                            ? "#f59e0b"
                            : "#10b981",
                        }}
                      >
                        {product.stock_quantity === 0 ? "Out of stock" : `${product.stock_quantity} in stock`}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "0.2rem 0.6rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: product.active ? "rgba(16,185,129,0.1)" : "rgba(100,100,100,0.15)",
                          color: product.active ? "#10b981" : "var(--muted)",
                        }}
                      >
                        {product.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                      {formatDate(product.created_at)}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            padding: "0.4rem 0.75rem",
                            background: "var(--gold-muted)",
                            color: "var(--gold)",
                            border: "1px solid var(--gold-border)",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            transition: "all 0.2s",
                          }}
                        >
                          <Edit size={12} />
                          Edit
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
