/**
 * restore-videos.mjs
 * Re-links the 18 re-encoded _web.mp4 files back to their products.
 * The files exist in storage but videos: [] was cleared from all products.
 *
 * Run: node scripts/restore-videos.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText.split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET       = "product-images";
const BASE         = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function url(filename) { return `${BASE}/${filename}`; }

// ── Mapping: product name keywords → video filenames ─────────────────────────
// Order determined by: (1) upload-new2-inventory.js insertion order for
// products-with-videos, (2) _web.mp4 timestamps in ascending order.
// The 18 re-encoded files (sorted by timestamp):
const WEB_VIDEOS = [
  "1773163279588_web.mp4",   // 1
  "1773163288831_web.mp4",   // 2
  "1773163292754_web.mp4",   // 3
  "1773163298687_web.mp4",   // 4
  "1773163303117_web.mp4",   // 5
  "1773163309576_web.mp4",   // 6
  "1773163315807_web.mp4",   // 7
  "1773163319865_web.mp4",   // 8  ─┐
  "1773163330447_web.mp4",   // 9  ─┘ 2 videos
  "1773163335139_web.mp4",   // 10
  "1773163342309_web.mp4",   // 11 ─┐
  "1773163346087_web.mp4",   // 12  │ 3 videos
  "1773163352449_web.mp4",   // 13 ─┘
  "1773163358703_web.mp4",   // 14
  "1773163361887_web.mp4",   // 15
  "1773163368889_web.mp4",   // 16 ─┐ 2 videos
  "1773163374947_web.mp4",   // 17 ─┘
  "1773163383949_web.mp4",   // 18
];

// Products with videos in upload order (only those with movs)
const PRODUCT_VIDEOS = [
  { nameLike: "Coral & Diamond Floral Pendant",        videos: [WEB_VIDEOS[0]] },
  { nameLike: "Emerald Peacock Pendant",                videos: [WEB_VIDEOS[1]] },
  { nameLike: "Amethyst Peacock Pendant",               videos: [WEB_VIDEOS[2]] },
  { nameLike: "Emerald Teardrop Victorian Pendant",     videos: [WEB_VIDEOS[3]] },
  { nameLike: "Coral & Jade Victorian Pendant",         videos: [WEB_VIDEOS[4]] },
  { nameLike: "Orange Coral & Polki Victorian",         videos: [WEB_VIDEOS[5]] },
  { nameLike: "Navratan Multi-Gem Flower Drop",         videos: [WEB_VIDEOS[6]] },
  { nameLike: "Grand Kundan Maangtikka",                videos: [WEB_VIDEOS[7], WEB_VIDEOS[8]] },
  { nameLike: "Sacred Krishna Temple Pendant",          videos: [WEB_VIDEOS[9]] },
  { nameLike: "Ivory Tiger Claw Pendant",               videos: [WEB_VIDEOS[10], WEB_VIDEOS[11], WEB_VIDEOS[12]] },
  { nameLike: "Kundan & Pearl Round Brooch",            videos: [WEB_VIDEOS[13]] },
  { nameLike: "Grand Kundan Floral Brooch",             videos: [WEB_VIDEOS[14]] },
  { nameLike: "Temple Lakshmi Goddess Antique Pendant", videos: [WEB_VIDEOS[15], WEB_VIDEOS[16]] },
  { nameLike: "Emerald & Diamond Tiger Claw Pendant",   videos: [WEB_VIDEOS[17]] },
];

async function main() {
  console.log("🎬  Restoring product videos...\n");

  let ok = 0, fail = 0;

  for (const entry of PRODUCT_VIDEOS) {
    // Find product by name ILIKE
    const { data: rows, error: qErr } = await supabase
      .from("products")
      .select("id, name, slug")
      .ilike("name", `%${entry.nameLike}%`)
      .limit(1);

    if (qErr || !rows?.length) {
      console.log(`  ❌  NOT FOUND: "${entry.nameLike}"`);
      fail++;
      continue;
    }

    const product = rows[0];
    const videoUrls = entry.videos.map(url);

    const { error: updErr } = await supabase
      .from("products")
      .update({ videos: videoUrls })
      .eq("id", product.id);

    if (updErr) {
      console.log(`  ❌  DB update failed for "${product.name}": ${updErr.message}`);
      fail++;
    } else {
      console.log(`  ✅  ${product.name}`);
      console.log(`       ${videoUrls.length} video(s): ${entry.videos.join(", ")}`);
      ok++;
    }
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`✅  Restored: ${ok} products`);
  if (fail) console.log(`❌  Failed:   ${fail} products`);
  console.log("\nVerifying restored data...");

  const { data: check } = await supabase
    .from("products")
    .select("name, videos")
    .not("videos", "eq", "{}");

  console.log(`\n📊  Products now with videos: ${check?.length ?? 0}`);
  check?.forEach(p => console.log(`   • ${p.name} — ${p.videos?.length} video(s)`));
}

main().catch(err => { console.error(err); process.exit(1); });
