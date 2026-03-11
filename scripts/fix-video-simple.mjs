#!/usr/bin/env node
/**
 * Re-encode all product videos as H.264 Constrained Baseline, no audio, max 720p.
 * Maximum browser/Safari compatibility.
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

  if (error) { console.error(error); process.exit(1); }

  const toFix = products.filter(p => p.videos?.some(v => v?.match(/\.(mov|mp4)$/i)));
  console.log(`${toFix.length} products to re-encode\n`);

  for (const product of toFix) {
    console.log(`▶ ${product.name}`);
    const newVideos = [...product.videos];
    let changed = false;

    for (let i = 0; i < product.videos.length; i++) {
      const videoUrl = product.videos[i];
      if (!videoUrl?.match(/\.(mov|mp4)$/i)) continue;

      const filename = videoUrl.split("/").pop();
      const storagePathMatch = videoUrl.match(/\/product-images\/(.+)$/);
      if (!storagePathMatch) continue;
      const storagePath = storagePathMatch[1];

      const newName = `${Date.now()}_web.mp4`;
      const tmpIn = join(tmpdir(), `ks_in_${newName}`);
      const tmpOut = join(tmpdir(), `ks_out_${newName}`);

      try {
        process.stdout.write(`  ↓ ${filename}... `);
        const { data: fileData, error: dlErr } = await supabase.storage.from(BUCKET).download(storagePath);
        if (dlErr) { console.log(`FAILED: ${dlErr.message}`); continue; }
        writeFileSync(tmpIn, Buffer.from(await fileData.arrayBuffer()));
        console.log("ok");

        process.stdout.write(`  ⚙ encoding... `);
        execFileSync("/opt/homebrew/bin/ffmpeg", [
          "-i", tmpIn,
          "-an",                          // no audio — simplest
          "-c:v", "libx264",
          "-profile:v", "baseline",
          "-level:v", "3.1",
          "-pix_fmt", "yuv420p",
          "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
          "-preset", "fast",
          "-crf", "23",
          "-movflags", "+faststart",
          "-y", tmpOut,
        ], { stdio: "pipe" });
        const outBuf = readFileSync(tmpOut);
        console.log(`${(outBuf.length/1024/1024).toFixed(1)}MB`);

        process.stdout.write(`  ↑ uploading ${newName}... `);
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(newName, outBuf, { contentType: "video/mp4", upsert: false });
        if (upErr) { console.log(`FAILED: ${upErr.message}`); continue; }
        console.log("ok");

        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(newName);
        newVideos[i] = publicUrl;
        changed = true;

        await supabase.storage.from(BUCKET).remove([storagePath]);
        console.log(`  ✓ → ${newName}`);

      } finally {
        if (existsSync(tmpIn)) unlinkSync(tmpIn);
        if (existsSync(tmpOut)) unlinkSync(tmpOut);
      }
    }

    if (changed) {
      const { error: updErr } = await supabase.from("products").update({ videos: newVideos }).eq("id", product.id);
      console.log(updErr ? `  DB FAILED: ${updErr.message}` : `  ✓ DB updated\n`);
    }
  }

  console.log("✅ Done!");
}

main().catch(err => { console.error(err); process.exit(1); });
