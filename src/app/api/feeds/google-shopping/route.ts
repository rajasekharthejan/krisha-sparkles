import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600; // Revalidate every hour

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, description, price, stock_quantity, images, category:categories(name)")
    .eq("active", true)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://krisha-sparkles.vercel.app";

  const items = (products || [])
    .map((p) => {
      const imageUrl = p.images?.[0] || "";
      const category = (p.category as { name?: string } | null)?.name || "Jewelry";
      const availability = p.stock_quantity > 0 ? "in stock" : "out of stock";
      const description = escapeXml((p.description || p.name).slice(0, 5000));

      return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${siteUrl}/shop/${escapeXml(p.slug)}</g:link>
      ${imageUrl ? `<g:image_link>${escapeXml(imageUrl)}</g:image_link>` : ""}
      <g:price>${Number(p.price).toFixed(2)} USD</g:price>
      <g:availability>${availability}</g:availability>
      <g:brand>Krisha Sparkles</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${escapeXml(category)}</g:product_type>
      <g:google_product_category>Apparel &amp; Accessories &gt; Jewelry</g:google_product_category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Krisha Sparkles — Product Feed</title>
    <link>${siteUrl}</link>
    <description>Imitation jewelry and ethnic wear from Krisha Sparkles</description>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
