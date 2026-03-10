#!/usr/bin/env node
/**
 * Convert .mov videos in Supabase storage to .mp4 (H.264/AAC)
 * and update product records in the database.
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SUPABASE_URL = "https://hdymmnygwwhszafymdvc.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeW1tbnlnd3doc3phZnltZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NjYwOCwiZXhwIjoyMDg3NTYyNjA4fQ.3ZCMN_fTm2kJlq5bWVANC3JD2fYqpdRjoGIEfxkNQFs";
const BUCKET = "product-images";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // 1. Find all products with .mov videos
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, videos")
    .not("videos", "is", null);

  if (error) { console.error("DB error:", error); process.exit(1); }

  const toConvert = products.filter(p =>
    p.videos?.some(v => v?.toLowerCase().endsWith(".mov"))
  );

  console.log(`Found ${toConvert.length} products with .mov videos\n`);
  if (toConvert.length === 0) { console.log("Nothing to do."); return; }

  for (const product of toConvert) {
    console.log(`\nProcessing: ${product.name}`);
    const newVideos = [...product.videos];

    for (let i = 0; i < product.videos.length; i++) {
      const videoUrl = product.videos[i];
      if (!videoUrl?.toLowerCase().endsWith(".mov")) continue;

      console.log(`  Converting video ${i + 1}: ${videoUrl.split("/").pop()}`);

      // Extract storage path from URL
      // URL format: https://.../storage/v1/object/public/product-images/PATH
      const storagePathMatch = videoUrl.match(/\/product-images\/(.+)$/);
      if (!storagePathMatch) { console.log("  Could not parse storage path, skipping"); continue; }
      const storagePath = storagePathMatch[1];
      const movFilename = storagePath.split("/").pop();
      const mp4Filename = movFilename.replace(/\.mov$/i, ".mp4");
      const newStoragePath = storagePath.replace(movFilename, mp4Filename);

      const tmpMov = join(tmpdir(), `ks_${Date.now()}_${movFilename}`);
      const tmpMp4 = join(tmpdir(), `ks_${Date.now()}_${mp4Filename}`);

      try {
        // Download .mov from Supabase storage
        console.log("  Downloading...");
        const { data: fileData, error: dlError } = await supabase.storage
          .from(BUCKET)
          .download(storagePath);
        if (dlError) { console.log("  Download error:", dlError.message); continue; }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        writeFileSync(tmpMov, buffer);
        console.log(`  Downloaded (${(buffer.length / 1024 / 1024).toFixed(1)} MB)`);

        // Convert to H.264 MP4 with ffmpeg
        console.log("  Converting to H.264 MP4...");
        execSync(
          `ffmpeg -i "${tmpMov}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -y "${tmpMp4}"`,
          { stdio: "inherit" }
        );

        const mp4Buffer = readFileSync(tmpMp4);
        console.log(`  Converted (${(mp4Buffer.length / 1024 / 1024).toFixed(1)} MB)`);

        // Upload .mp4 to Supabase storage
        console.log("  Uploading .mp4...");
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(newStoragePath, mp4Buffer, {
            contentType: "video/mp4",
            upsert: true,
          });
        if (uploadError) { console.log("  Upload error:", uploadError.message); continue; }

        // Get public URL for the new .mp4
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(newStoragePath);

        newVideos[i] = publicUrl;
        console.log(`  Done → ${publicUrl.split("/").pop()}`);

        // Delete old .mov from storage
        await supabase.storage.from(BUCKET).remove([storagePath]);
        console.log("  Deleted old .mov");
      } finally {
        if (existsSync(tmpMov)) unlinkSync(tmpMov);
        if (existsSync(tmpMp4)) unlinkSync(tmpMp4);
      }
    }

    // Update product record
    const { error: updateError } = await supabase
      .from("products")
      .update({ videos: newVideos })
      .eq("id", product.id);

    if (updateError) {
      console.log(`  DB update error: ${updateError.message}`);
    } else {
      console.log(`  Updated DB for ${product.name}`);
    }
  }

  console.log("\n✅ All done!");
}

main().catch(console.error);
