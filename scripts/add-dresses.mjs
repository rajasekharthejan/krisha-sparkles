/**
 * Bulk upload script — adds 4 Indian dress products to Krisha Sparkles
 * Run with: node scripts/add-dresses.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";

const SUPABASE_URL = "https://hdymmnygwwhszafymdvc.supabase.co";
// Legacy JWT service role key (from Supabase Management API)
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeW1tbnlnd3doc3phZnltZHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk4NjYwOCwiZXhwIjoyMDg3NTYyNjA4fQ.3ZCMN_fTm2kJlq5bWVANC3JD2fYqpdRjoGIEfxkNQFs";
const DOWNLOADS = "/Users/rajasekharthejanarapareddy/Downloads";
const BUCKET = "product-images";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function findImage(name) {
  const jpgUpper = `${DOWNLOADS}/${name}.JPG`;
  const jpgLower = `${DOWNLOADS}/${name}.jpg`;
  if (existsSync(jpgUpper)) return jpgUpper;
  if (existsSync(jpgLower)) return jpgLower;
  throw new Error(`Image not found: ${name}`);
}

// Range helper: generates ["IMG_7913","IMG_7914",...,"IMG_7925"]
function imgRange(start, end) {
  const result = [];
  const step = start <= end ? 1 : -1;
  for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
    result.push(`IMG_${i}`);
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dress definitions
// ─────────────────────────────────────────────────────────────────────────────
const DRESSES = [
  {
    name: "Crimson Embroidered Anarkali Dress",
    description:
      "Striking crimson red Anarkali dress featuring vibrant multicolor floral embroidery and sequin accents on the yoke. The beautifully pleated silhouette with short sleeves creates an elegant, festive look perfect for weddings, parties, and celebrations. Lightweight fabric with a stunning drape. Available in size 40.",
    price: 79.99,
    compare_price: 99.99,
    imageNames: imgRange(7913, 7925),  // 13 images
    variants: [{ name: "Size", options: ["40"] }],
    color: "Red",
    occasion: "Wedding",
    style: "Traditional",
    material: "Rayon",
    tags: ["anarkali", "embroidered", "red", "floral", "festive", "crimson"],
    stock_quantity: 1,
  },
  {
    name: "Sunshine Yellow 3D Floral Anarkali",
    description:
      "Radiant sunshine yellow Anarkali adorned with exquisite 3D floral embroidery and sequin detailing on the yoke. The dimensional blooms and intricate beadwork make this a truly showstopping piece for weddings and festive celebrations. The luxurious pleated skirt flows beautifully for a regal silhouette. Available in size 44.",
    price: 89.99,
    compare_price: 119.99,
    imageNames: imgRange(7908, 7912),  // 5 images
    variants: [{ name: "Size", options: ["44"] }],
    color: "Gold",
    occasion: "Wedding",
    style: "Traditional",
    material: "Silk",
    tags: ["anarkali", "embroidered", "yellow", "3d floral", "sequin", "wedding", "bridal"],
    stock_quantity: 1,
  },
  {
    name: "Orange Rose Print Anarkali with Net Skirt",
    description:
      "Vibrant orange Anarkali featuring a stunning purple rose print on the bodice and full sleeves, paired with a beautiful flowing orange net skirt. The bold floral print combined with delicate embroidery details creates a unique fusion look that stands out at any festive occasion. Full-length sleeves add graceful coverage. Available in size 40.",
    price: 74.99,
    compare_price: 94.99,
    imageNames: imgRange(7907, 7897),  // 11 images (7907 down to 7897)
    variants: [{ name: "Size", options: ["40"] }],
    color: "Multi",
    occasion: "Festival",
    style: "Fusion",
    material: "Net",
    tags: ["anarkali", "rose print", "orange", "net skirt", "full sleeve", "purple", "fusion"],
    stock_quantity: 1,
  },
  {
    name: "Olive Floral Sequin Lace Kurti Dress",
    description:
      "Elegant olive gold sleeveless kurti dress with a beautiful watercolor floral print throughout. Features an intricate sequin-embellished crochet lace trim at the empire waist and a graceful flared silhouette with dark green ruffle hem. A versatile piece perfect for casual gatherings to festive occasions. Available in sizes 40 and 44.",
    price: 69.99,
    compare_price: 89.99,
    imageNames: imgRange(7890, 7896),  // 7 images
    variants: [{ name: "Size", options: ["40", "44"] }],
    color: "Green",
    occasion: "Casual",
    style: "Traditional",
    material: "Cotton",
    tags: ["kurti", "floral", "olive", "lace trim", "sequin", "sleeveless", "green"],
    stock_quantity: 1,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Step 1: Ensure Dresses category exists
// ─────────────────────────────────────────────────────────────────────────────
async function ensureDressesCategory() {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "dresses")
    .single();

  if (existing) {
    console.log("✓ Dresses category already exists:", existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: "Dresses", slug: "dresses", icon: "👗" })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create category: ${error.message}`);
  console.log("✓ Created Dresses category:", data.id);
  return data.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2: Upload a single image and return its public URL
// ─────────────────────────────────────────────────────────────────────────────
async function uploadImage(localPath, storagePath) {
  const fileBuffer = readFileSync(localPath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed for ${localPath}: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3: Create a product record
// ─────────────────────────────────────────────────────────────────────────────
async function createProduct(dress, categoryId, imageUrls) {
  const slug = dress.name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  // Check for existing slug and make unique if needed
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: dress.name,
      slug: finalSlug,
      description: dress.description,
      price: dress.price,
      compare_price: dress.compare_price,
      category_id: categoryId,
      images: imageUrls,
      stock_quantity: dress.stock_quantity,
      featured: false,
      active: true,
      variants: dress.variants,
      tags: dress.tags,
      material: dress.material,
      color: dress.color,
      occasion: dress.occasion,
      style: dress.style,
      updated_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(`Failed to create product "${dress.name}": ${error.message}`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🪡  Krisha Sparkles — Adding Dress Collection\n");
  console.log("=".repeat(50));

  // Step 1: Category
  const categoryId = await ensureDressesCategory();

  // Step 2 & 3: Process each dress
  for (let dressIdx = 0; dressIdx < DRESSES.length; dressIdx++) {
    const dress = DRESSES[dressIdx];
    console.log(`\n📦 Dress ${dressIdx + 1}: ${dress.name}`);
    console.log(`   ${dress.imageNames.length} images — size(s): ${dress.variants[0].options.join(", ")}`);

    // Upload images
    const productId = randomUUID();
    const imageUrls = [];

    for (let imgIdx = 0; imgIdx < dress.imageNames.length; imgIdx++) {
      const imgName = dress.imageNames[imgIdx];
      try {
        const localPath = findImage(imgName);
        const storagePath = `products/dresses/${productId}/img-${String(imgIdx + 1).padStart(2, "0")}.jpg`;
        const url = await uploadImage(localPath, storagePath);
        imageUrls.push(url);
        process.stdout.write(`   📸 Uploaded ${imgIdx + 1}/${dress.imageNames.length}: ${imgName}\r`);
      } catch (err) {
        console.error(`\n   ⚠️  Skipping ${imgName}: ${err.message}`);
      }
    }

    console.log(`\n   ✅ Uploaded ${imageUrls.length} images`);

    // Create product
    const product = await createProduct(dress, categoryId, imageUrls);
    console.log(`   🛍️  Product created: ${product.slug} (${product.id})`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉  All 4 dresses added successfully!");
  console.log("🔗  View at: https://shopkrisha.com/shop?category=dresses\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
