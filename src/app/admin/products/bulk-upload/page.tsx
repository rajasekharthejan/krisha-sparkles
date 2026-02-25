"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface ParsedRow {
  name: string;
  description: string;
  price: string;
  compare_price: string;
  category_slug: string;
  stock_quantity: string;
  featured: string;
  image_url_1: string;
  image_url_2: string;
  image_url_3: string;
  _valid?: boolean;
  _error?: string;
}

const CSV_TEMPLATE = `name,description,price,compare_price,category_slug,stock_quantity,featured,image_url_1,image_url_2,image_url_3
Kundan Bridal Set,Beautiful handcrafted Kundan set,89.99,129.99,necklaces,10,true,https://example.com/img1.jpg,,
Gold Jhumka Earrings,Traditional gold jhumka,24.99,,earrings,25,false,https://example.com/img2.jpg,,`;

const VALID_CATEGORIES = ["necklaces", "earrings", "bangles-bracelets", "pendant-sets", "jadau-jewelry", "hair-accessories", "dresses"];

function validateRow(row: ParsedRow): { valid: boolean; error?: string } {
  if (!row.name?.trim()) return { valid: false, error: "Name required" };
  if (!row.price || isNaN(Number(row.price)) || Number(row.price) <= 0)
    return { valid: false, error: "Invalid price" };
  if (row.category_slug && !VALID_CATEGORIES.includes(row.category_slug.toLowerCase().trim()))
    return { valid: false, error: `Invalid category: ${row.category_slug}` };
  if (row.compare_price && isNaN(Number(row.compare_price)))
    return { valid: false, error: "Invalid compare price" };
  return { valid: true };
}

export default function BulkUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ success: number; failed: number; errors: { row: number; error: string }[] } | null>(null);

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.filter((r) => !r._valid).length;

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "krisha-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data.map((row) => {
          const validation = validateRow(row);
          return { ...row, _valid: validation.valid, _error: validation.error };
        });
        setRows(parsed);
      },
    });
  }

  async function handleImport() {
    if (validCount === 0) return;
    setImporting(true);
    setProgress(0);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/admin/login"); return; }

      const validRows = rows.filter((r) => r._valid);
      const BATCH = 50;
      let totalSuccess = 0, totalFailed = 0;
      const allErrors: { row: number; error: string }[] = [];

      for (let i = 0; i < validRows.length; i += BATCH) {
        const batch = validRows.slice(i, i + BATCH);
        const res = await fetch("/api/admin/products/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ products: batch }),
        });
        const data = await res.json();
        totalSuccess += data.success ?? 0;
        totalFailed += data.failed ?? 0;
        allErrors.push(...(data.errors ?? []));
        setProgress(Math.round(((i + BATCH) / validRows.length) * 100));
      }

      setResult({ success: totalSuccess, failed: totalFailed, errors: allErrors });
    } finally {
      setImporting(false);
      setProgress(100);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => router.push("/admin/products")}
          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.6rem", color: "var(--text)", margin: 0 }}>
            Bulk Product Upload
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
            Upload up to 500 products at once via CSV
          </p>
        </div>
      </div>

      {/* Step 1 — Download Template */}
      <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
        <h3 style={{ color: "var(--text)", marginBottom: "0.75rem", fontSize: "1rem" }}>
          Step 1 — Download CSV Template
        </h3>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Fill in the template with your products. Supported categories:{" "}
          <span style={{ color: "var(--gold)" }}>{VALID_CATEGORIES.join(", ")}</span>
        </p>
        <button onClick={downloadTemplate} className="btn-gold-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <Download size={16} /> Download Template
        </button>
      </div>

      {/* Step 2 — Upload CSV */}
      <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
        <h3 style={{ color: "var(--text)", marginBottom: "0.75rem", fontSize: "1rem" }}>
          Step 2 — Upload Your CSV
        </h3>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed rgba(201,168,76,0.3)",
            borderRadius: "10px",
            padding: "2rem",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold)")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
        >
          <Upload size={32} style={{ color: "var(--gold)", marginBottom: "0.75rem" }} />
          <p style={{ color: "var(--text)", margin: "0 0 0.25rem" }}>Click to upload CSV file</p>
          <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>Max 500 rows</p>
        </div>
      </div>

      {/* Step 3 — Preview & Import */}
      {rows.length > 0 && (
        <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h3 style={{ color: "var(--text)", margin: "0 0 0.25rem", fontSize: "1rem" }}>
                Step 3 — Review & Import
              </h3>
              <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem" }}>
                <span style={{ color: "#4ade80" }}>✓ {validCount} valid</span>
                {invalidCount > 0 && <span style={{ color: "#f87171" }}>✗ {invalidCount} errors</span>}
              </div>
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="btn-gold"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: importing || validCount === 0 ? 0.6 : 1 }}
            >
              {importing ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={16} />}
              Import {validCount} Products
            </button>
          </div>

          {/* Progress bar */}
          {importing && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", height: "6px" }}>
                <div style={{ background: "var(--gold)", width: `${progress}%`, height: "100%", transition: "width 0.3s" }} />
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.4rem" }}>{progress}% complete</p>
            </div>
          )}

          {/* Preview Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ fontSize: "0.8rem", width: "100%" }}>
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Images</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((row, i) => (
                  <tr key={i} style={{ opacity: row._valid ? 1 : 0.7 }}>
                    <td>
                      {row._valid
                        ? <CheckCircle size={14} style={{ color: "#4ade80" }} />
                        : <span title={row._error}><XCircle size={14} style={{ color: "#f87171" }} /></span>}
                    </td>
                    <td style={{ color: row._valid ? "var(--text)" : "#f87171" }}>{row.name || "—"}</td>
                    <td>${row.price}</td>
                    <td>{row.category_slug || "—"}</td>
                    <td>{row.stock_quantity || 0}</td>
                    <td>{row.featured === "true" ? "Yes" : "No"}</td>
                    <td>{[row.image_url_1, row.image_url_2, row.image_url_3].filter(Boolean).length} URLs</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 100 && (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", padding: "0.5rem 0" }}>
                Showing first 100 of {rows.length} rows
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass" style={{ padding: "1.5rem", borderRadius: "12px", border: `1px solid ${result.failed === 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            {result.failed === 0
              ? <CheckCircle size={24} style={{ color: "#4ade80" }} />
              : <AlertCircle size={24} style={{ color: "#f59e0b" }} />}
            <div>
              <p style={{ color: "var(--text)", margin: 0, fontWeight: 600 }}>
                Import complete — {result.success} succeeded, {result.failed} failed
              </p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
              {result.errors.slice(0, 10).map((e, i) => (
                <p key={i} style={{ margin: "0.2rem 0" }}>Row {e.row}: {e.error}</p>
              ))}
            </div>
          )}
          {result.success > 0 && (
            <button onClick={() => router.push("/admin/products")} className="btn-gold" style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
              View Products
            </button>
          )}
        </div>
      )}
    </div>
  );
}
