import { createAdminClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";
import ReviewsTable from "./ReviewsTable";
import type { Review } from "@/types";

export default async function AdminReviewsPage() {
  const supabase = await createAdminClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  const allReviews = (reviews as Review[]) || [];
  const pending = allReviews.filter((r) => !r.approved).length;

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: "1.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Star size={22} style={{ color: "var(--gold)" }} /> Reviews
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {allReviews.length} total · {pending > 0 ? <span style={{ color: "#f59e0b" }}>{pending} pending approval</span> : "all approved"}
          </p>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--gold-border)", borderRadius: "12px", overflow: "hidden" }}>
        <ReviewsTable initialReviews={allReviews} />
      </div>
    </div>
  );
}
