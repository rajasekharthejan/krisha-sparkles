#!/usr/bin/env node
/**
 * Re-encode all product .mp4 videos as H.264 8-bit (yuv420p) for browser compatibility.
 * Downloads current file → re-encodes → uploads with fresh timestamp name → updates DB.
 */
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SUPABASE_URL = "https://hdymmnygwwhszafymdvc.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeW1tbnlnd3doc3phZnltZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NjYwOCwiZXhwIjoyMDg3NTYyNjA4fQ.3ZCMN_fTm2kJlq5bWVANC3JD2fYqpdRjoGIEfxkNQFs";
const BUCKET = "product-images";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, videos")
    .not("videos", "is", null);

  if (error) { console.error("DB error:", error); process.exit(1); }

  const toFix = products.filter(p =>
    p.videos?.some(v => v?.match(/\.(mov|mp4)$/i))
  );

  console.log(`Found ${toFix.length} products with videos\n`);

  for (const product of toFix) {
    console.log(`\n▶ ${product.name}`);
    const newVideos = [...product.videos];
    let changed = false;

    for (let i = 0; i < product.videos.length; i++) {
      const videoUrl = product.videos[i];
      if (!videoUrl?.match(/\.(mov|mp4)$/i)) continue;

      const filename = videoUrl.split("/").pop();
      const storagePathMatch = videoUrl.match(/\/product-images\/(.+)$/);
      if (!storagePathMatch) { console.log("  Could not parse path, skipping"); continue; }
      const storagePath = storagePathMatch[1];

      const tmpIn = join(tmpdir(), `ks_in_${Date.now()}_${filename}`);
      const newName = `${Date.now()}_h264.mp4`;
      const tmpOut = join(tmpdir(), `ks_out_${newName}`);

      try {
        // 1. Download
        process.stdout.write(`  Downloading ${filename}... `);
        const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET).download(storagePath);
        if (dlErr) { console.log(`FAILED: ${dlErr.message}`); continue; }
        const inBuf = Buffer.from(await fileData.arrayBuffer());
        writeFileSync(tmpIn, inBuf);
        console.log(`${(inBuf.length/1024/1024).toFixed(1)}MB`);

        // 2. Re-encode to H.264 8-bit using execFileSync (no shell, no glob issues)
        process.stdout.write(`  Encoding to H.264 8-bit... `);
        execFileSync("/opt/homebrew/bin/ffmpeg", [
          "-i", tmpIn,
          "-map", "0:v:0",
          "-map", "0:a:0?",
          "-c:v", "libx264",
          "-profile:v", "high",
          "-level:v", "4.1",
          "-pix_fmt", "yuv420p",
          "-preset", "fast",
          "-crf", "22",
          "-c:a", "aac",
          "-b:a", "128k",
          "-ar", "44100",
          "-ac", "2",
          "-movflags", "+faststart",
          "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
          "-y", tmpOut,
        ], { stdio: "pipe" });
        const outBuf = readFileSync(tmpOut);
        console.log(`${(outBuf.length/1024/1024).toFixed(1)}MB`);

        // 3. Upload new file
        process.stdout.write(`  Uploading ${newName}... `);
        const { data: upData, error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(newName, outBuf, { contentType: "video/mp4", upsert: false });
        if (upErr) { console.log(`FAILED: ${upErr.message}`); continue; }
        console.log("OK");

        // 4. Get public URL
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(newName);
        newVideos[i] = publicUrl;
        changed = true;
        console.log(`  → ${publicUrl}`);

        // 5. Delete old file
        await supabase.storage.from(BUCKET).remove([storagePath]);
        console.log(`  Deleted old ${filename}`);

      } finally {
        if (existsSync(tmpIn)) unlinkSync(tmpIn);
        if (existsSync(tmpOut)) unlinkSync(tmpOut);
      }
    }

    if (changed) {
      const { error: updErr } = await supabase.from("products").update({ videos: newVideos }).eq("id", product.id);
      if (updErr) {
        console.log(`  DB UPDATE FAILED: ${updErr.message}`);
      } else {
        console.log(`  ✓ DB updated`);
      }
    }
  }

  console.log("\n✅ All done!");
}

main().catch(err => { console.error(err); process.exit(1); });
