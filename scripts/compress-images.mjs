/**
 * compress-images.mjs
 * Downloads every product image from Supabase, compresses to WebP (max 1200px, q=82),
 * re-uploads (same filename), and reports size savings.
 *
 * Run: node scripts/compress-images.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

// Load env
const envText = readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText.split("\n").filter(l => l && !l.startsWith("#") && l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET       = "product-images";
const MAX_PX       = 1200;   // max width OR height
const QUALITY      = 82;     // WebP quality (82 = excellent, visually indistinguishable from original)
const MIN_SAVING   = 20;     // skip if saving < 20% (already small enough)

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, images")
    .not("images", "is", null);
  if (error) throw error;
  return data.filter(p => p.images?.length > 0);
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function compressImage(inputBuf) {
  return sharp(inputBuf)
    .rotate()                          // auto-orient from EXIF
    .resize({ width: MAX_PX, height: MAX_PX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();
}

async function uploadImage(filename, buf, mimeType = "image/webp") {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buf, { contentType: mimeType, upsert: true });
  if (error) throw error;
}

function getPublicUrl(filename) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}

async function main() {
  console.log("🔍  Fetching products...");
  const products = await getProducts();
  console.log(`   Found ${products.length} products with images\n`);

  let totalOriginalKB = 0;
  let totalCompressedKB = 0;
  let skipped = 0;
  let processed = 0;
  let errors = 0;

  for (const product of products) {
    const newImages = [...product.images];
    let changed = false;

    for (let i = 0; i < product.images.length; i++) {
      const url = product.images[i];
      if (!url) continue;

      // Extract filename from URL
      const rawFilename = url.split("/").pop()?.split("?")[0];
      if (!rawFilename) continue;

      // Skip if already .webp
      if (rawFilename.toLowerCase().endsWith(".webp")) {
        console.log(`  ⏭  ${product.name} [${i + 1}] — already WebP, skipping`);
        skipped++;
        continue;
      }

      try {
        process.stdout.write(`  📥 ${product.name.substring(0,35).padEnd(35)} [${i + 1}/${product.images.length}] downloading... `);
        const originalBuf = await downloadImage(url);
        const origKB = Math.round(originalBuf.length / 1024);
        totalOriginalKB += origKB;

        const compressedBuf = await compressImage(originalBuf);
        const compKB = Math.round(compressedBuf.length / 1024);
        totalCompressedKB += compKB;

        const saving = ((origKB - compKB) / origKB * 100).toFixed(0);

        if ((origKB - compKB) / origKB * 100 < MIN_SAVING) {
          console.log(`⏭  ${origKB}KB → ${compKB}KB (only ${saving}% saving, skipping upload)`);
          skipped++;
          continue;
        }

        // Build new filename: strip extension, add _c.webp suffix
        const base = rawFilename.replace(/\.[^.]+$/, "");
        const newFilename = `${base}_c.webp`;

        process.stdout.write(`${origKB}KB → ${compKB}KB (-${saving}%) uploading... `);
        await uploadImage(newFilename, compressedBuf);

        newImages[i] = getPublicUrl(newFilename);
        changed = true;
        processed++;
        console.log("✅");
      } catch (err) {
        console.log(`\n  ❌ ERROR: ${err.message}`);
        errors++;
      }
    }

    // Update DB if any image changed
    if (changed) {
      const { error } = await supabase
        .from("products")
        .update({ images: newImages })
        .eq("id", product.id);
      if (error) console.log(`  ⚠️  DB update failed for ${product.name}: ${error.message}`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`✅  Done!`);
  console.log(`   Processed : ${processed} images`);
  console.log(`   Skipped   : ${skipped} images`);
  console.log(`   Errors    : ${errors}`);
  console.log(`   Original  : ${(totalOriginalKB / 1024).toFixed(1)} MB`);
  console.log(`   Compressed: ${(totalCompressedKB / 1024).toFixed(1)} MB`);
  if (totalOriginalKB > 0) {
    console.log(`   Saved     : ${((totalOriginalKB - totalCompressedKB) / totalOriginalKB * 100).toFixed(0)}% smaller`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
