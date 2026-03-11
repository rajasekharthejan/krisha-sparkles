#!/usr/bin/env node
/**
 * Upload new2 folder images + videos to Supabase and create product inventory.
 * Run: node scripts/upload-new2-inventory.js
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load .env.local
const envFile = path.join(__dirname, "../.env.local");
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const NEW2_DIR = "/Users/rajasekharthejanarapareddy/Downloads/new2";
const JPGS_DIR = "/tmp/new2_jpgs";

// ─── Product definitions ─────────────────────────────────────────────────────
// Each product: { name, description, category_slug, heics: [], movs: [], tags, material, color, occasion }
const PRODUCTS = [
  {
    name: "Royal Ruby Chandbali Earrings",
    description: "Exquisitely crafted chandbali earrings featuring vibrant ruby-red kundan stones set in antique gold, surrounded by sparkling polki diamonds. The elegant crescent-moon frame cascades into a delicate fringe of mint jade drops and freshwater pearls — perfect for bridal and festive occasions.",
    category_slug: "earrings",
    heics: ["IMG_6246","IMG_6247","IMG_6248","IMG_6249","IMG_6250","IMG_6251","IMG_6252","IMG_6253"],
    movs: [],
    tags: ["chandbali","ruby","kundan","polki","bridal","festive"],
    material: "Antique Gold Plated",
    color: "Ruby Red & Mint Green",
    occasion: "Bridal, Festive",
  },
  {
    name: "Heritage Layered Jhumka Earrings",
    description: "Statement jhumka earrings featuring a multi-tiered dome design with ruby-pink kundan stones and sparkling polki diamonds in an antique gold setting. Finished with dangling pale jade bead drops, these earrings bring the timeless art of Indian jewelry-making to any bridal or ethnic ensemble.",
    category_slug: "earrings",
    heics: ["IMG_6254","IMG_6255","IMG_6256","IMG_6257","IMG_6258","IMG_6259"],
    movs: [],
    tags: ["jhumka","ruby","kundan","polki","bridal","layered"],
    material: "Antique Gold Plated",
    color: "Ruby Pink & Jade Green",
    occasion: "Bridal, Festive",
  },
  {
    name: "Meenakari Ruby & Emerald Chandbali Earrings",
    description: "A fusion of traditional Meenakari enamel artistry with kundan craftsmanship. These chandbali earrings showcase a striking combination of ruby-red and vibrant green stones framed by polki diamonds in antique gold. The cascading fringe of freshwater pearls and jade beads adds graceful movement for weddings and festive celebrations.",
    category_slug: "earrings",
    heics: ["IMG_6260","IMG_6261","IMG_6262","IMG_6263","IMG_6264","IMG_6265"],
    movs: [],
    tags: ["chandbali","meenakari","ruby","emerald","polki","bridal"],
    material: "Antique Gold Plated",
    color: "Ruby Red & Emerald Green",
    occasion: "Bridal, Wedding",
  },
  {
    name: "Kundan Square-Top Pearl Jhumka Earrings",
    description: "Elegant two-part earrings featuring a bold square kundan top stud adorned with ruby and polki diamonds, paired with a rounded dome jhumka bell. Freshwater pearl and mint jade bead drops provide a delicate finishing touch — perfect for brides seeking a distinctive blend of vintage and contemporary Indian jewelry.",
    category_slug: "earrings",
    heics: ["IMG_6266","IMG_6267","IMG_6268","IMG_6269"],
    movs: [],
    tags: ["jhumka","kundan","ruby","pearl","square","bridal"],
    material: "Antique Gold Plated",
    color: "Ruby & Pearl",
    occasion: "Bridal, Festive",
  },
  {
    name: "Floral Meenakari Ear Chain Earrings",
    description: "Unique multi-piece floral earrings crafted in the traditional Meenakari style. The set features vibrant pink, red, and green enamel work with chain connectors and hanging pearl and emerald bead drops. A conversation piece that bridges traditional Indian artistry with modern jewelry fashion.",
    category_slug: "earrings",
    heics: ["IMG_6270","IMG_6271","IMG_6272","IMG_6273"],
    movs: [],
    tags: ["meenakari","floral","ear-chain","pink","green","festive"],
    material: "Antique Gold Plated",
    color: "Multi-Color (Pink, Green, Pearl)",
    occasion: "Festive, Casual",
  },
  {
    name: "Jadau Long Drop Earrings with Emerald Jhumka",
    description: "Spectacular long-drop earrings showcasing the exquisite art of Jadau craftsmanship. A delicate flower stud is connected through ornate chain links to a rounded jhumka ball, all set with pink ruby and emerald stones in antique gold. Freshwater pearl drops complete this masterpiece, ideal for bridal ceremonies and grand occasions.",
    category_slug: "jadau-jewelry",
    heics: ["IMG_6274","IMG_6275","IMG_6276","IMG_6277","IMG_6278"],
    movs: [],
    tags: ["jadau","long-drop","jhumka","ruby","emerald","chain","bridal"],
    material: "Antique Gold Plated",
    color: "Ruby Pink & Emerald Green",
    occasion: "Bridal, Grand Occasion",
  },
  {
    name: "Coral & Diamond Floral Pendant Set",
    description: "A breathtaking pendant set centered around a deep red coral cabochon stone, surrounded by an intricate floral halo of polki diamonds and emerald green accent stones in antique gold. The matching stud earrings feature the same coral and diamond motif, creating a perfectly coordinated set that commands attention at any festive or bridal occasion.",
    category_slug: "pendant-sets",
    heics: ["IMG_6279","IMG_6280","IMG_6281","IMG_6282"],
    movs: ["IMG_6283.mov"],
    tags: ["pendant-set","coral","polki","diamond","emerald","bridal"],
    material: "Antique Gold Plated",
    color: "Coral Red & Emerald Green",
    occasion: "Bridal, Festive",
  },
  {
    name: "Emerald Peacock Pendant & Earring Set",
    description: "A magnificent peacock-motif pendant set featuring a stunning large emerald green center stone, encircled by triangular polki diamonds in a majestic fan display. The peacock's tail spreads in brilliant diamond pavé, with ruby accent eyes. Matching stud earrings carry the same emerald and polki combination — a jewel-lover's dream for bridal and ceremonial wear.",
    category_slug: "pendant-sets",
    heics: ["IMG_6284","IMG_6285","IMG_6286","IMG_6287"],
    movs: ["IMG_6288.mov"],
    tags: ["peacock","pendant-set","emerald","polki","diamond","bridal"],
    material: "Antique Gold Plated",
    color: "Emerald Green & Diamond",
    occasion: "Bridal, Ceremonial",
  },
  {
    name: "Amethyst Peacock Pendant & Earring Set",
    description: "A regal peacock-motif pendant set featuring a captivating large amethyst (purple) center stone, surrounded by triangular polki diamonds arranged in the iconic peacock fan. Ruby accent eyes add vibrant contrast, while the matching stud earrings create a harmonious bridal set. A magnificent choice for those who desire something uniquely luxurious.",
    category_slug: "pendant-sets",
    heics: ["IMG_6289","IMG_6290","IMG_6291"],
    movs: ["IMG_6292.mov"],
    tags: ["peacock","pendant-set","amethyst","purple","polki","bridal"],
    material: "Antique Gold Plated",
    color: "Amethyst Purple & Diamond",
    occasion: "Bridal, Ceremonial",
  },
  {
    name: "Emerald Teardrop Victorian Pendant & Earring Set",
    description: "An opulent Victorian-inspired set featuring lush emerald green teardrop gemstones set in ornate gold scrollwork with polki diamond accents. The statement pendant pairs effortlessly with matching stud earrings, creating a complete look that's both timeless and luxurious. Perfect for weddings, festivals, and high-profile events.",
    category_slug: "pendant-sets",
    heics: ["IMG_6293","IMG_6294","IMG_6295"],
    movs: ["IMG_6296.MOV"],
    tags: ["victorian","pendant-set","emerald","teardrop","polki","bridal"],
    material: "Antique Gold Plated",
    color: "Emerald Green",
    occasion: "Bridal, Wedding, Festive",
  },
  {
    name: "Coral & Jade Victorian Pendant Set",
    description: "A distinctive Victorian-era inspired pendant set featuring rich orange coral cabochons alongside jade green stones, connected by an intricate polki diamond butterfly motif in antique gold. The set includes a statement pendant and coordinating earrings — bold, eclectic style for festive and ceremonial occasions.",
    category_slug: "pendant-sets",
    heics: ["IMG_6297","IMG_6298","IMG_6299"],
    movs: ["IMG_6300.mov"],
    tags: ["victorian","pendant-set","coral","jade","polki","festive"],
    material: "Antique Gold Plated",
    color: "Coral Orange & Jade Green",
    occasion: "Festive, Ceremonial",
  },
  {
    name: "Citrine & Ruby Polki Chandelier Earrings",
    description: "Dramatic chandelier earrings featuring a striking combination of deep pink ruby rectangular stones and luminous yellow citrine teardrop drops, all set in intricate polki diamond scrollwork with antique gold finishing. These bold statement earrings are designed to dazzle at weddings, receptions, and festive events.",
    category_slug: "earrings",
    heics: ["IMG_6303","IMG_6304"],
    movs: [],
    tags: ["chandelier","citrine","ruby","polki","festive","statement"],
    material: "Antique Gold Plated",
    color: "Citrine Yellow & Ruby Pink",
    occasion: "Wedding, Festive",
  },
  {
    name: "Orange Coral & Polki Victorian Drop Earrings",
    description: "Sophisticated drop earrings featuring vibrant orange coral cabochon stones set in elaborate polki diamond Victorian scroll settings in antique gold. The stud and drop design creates a versatile look that can be worn separately or together for layered styling — bringing warmth and elegance to any outfit.",
    category_slug: "earrings",
    heics: ["IMG_6305","IMG_6306","IMG_6307"],
    movs: ["IMG_6308.mov"],
    tags: ["coral","victorian","drop-earrings","polki","scroll","festive"],
    material: "Antique Gold Plated",
    color: "Coral Orange",
    occasion: "Festive, Party",
  },
  {
    name: "Navratan Multi-Gem Flower Drop Earrings",
    description: "Vibrant navratan (nine gems) inspired floral earrings featuring a rainbow of precious cabochon stones — aqua turquoise, red coral, jade green, and pale celadon — arranged in a colorful flower setting with CZ diamond accents. A delicate snowflake diamond stud completes the look. Celebrating the ancient Indian tradition of wearing all nine celestial gems.",
    category_slug: "earrings",
    heics: ["IMG_6310","IMG_6311","IMG_6312"],
    movs: ["IMG_6309.mov"],
    tags: ["navratan","multi-gem","floral","turquoise","coral","festive","colorful"],
    material: "Antique Gold Plated",
    color: "Multi-Color (Navratan)",
    occasion: "Festive, Navratri, Diwali",
  },
  {
    name: "Grand Kundan Maangtikka with Pearl Fringe",
    description: "A magnificent circular maangtikka (forehead ornament) that doubles as a statement brooch, featuring concentric rings of ruby-red kundan stones, polki diamonds, and emerald green accents in antique gold. The fringe of freshwater pearls and jade beads creates an exquisite cascading effect — a centerpiece accessory for brides and festive occasions.",
    category_slug: "hair-accessories",
    heics: ["IMG_6313","IMG_6314","IMG_6315","IMG_6316"],
    movs: ["IMG_6317.mov","IMG_6318.mov"],
    tags: ["maangtikka","kundan","ruby","pearl","jade","bridal","brooch"],
    material: "Antique Gold Plated",
    color: "Ruby Red & Emerald Green",
    occasion: "Bridal, Festive, Navratri",
  },
  {
    name: "Sacred Krishna Temple Pendant",
    description: "A devotional masterpiece featuring an intricately detailed depiction of Lord Krishna in a traditional arched temple frame, surrounded by vibrant ruby-red and emerald green stones with polki diamond accents in antique gold. Pearl and jade bead drops add an elegant finish — a deeply meaningful piece for cultural celebrations and as a cherished gift.",
    category_slug: "pendant-sets",
    heics: ["IMG_6319","IMG_6320"],
    movs: ["IMG_6321.mov"],
    tags: ["temple","krishna","pendant","ruby","emerald","polki","divine"],
    material: "Antique Gold Plated",
    color: "Ruby Red & Emerald Green",
    occasion: "Festive, Puja, Gift",
  },
  {
    name: "Ivory Tiger Claw Pendant with Kundan",
    description: "A striking and symbolic pendant inspired by the traditional 'navaratna' tiger claw (baghnak) motif, featuring two gracefully curved ivory-white components adorned with a polki diamond and emerald kundan top piece. This unique pendant carries cultural and spiritual significance while making a bold fashion statement.",
    category_slug: "pendant-sets",
    heics: ["IMG_6322","IMG_6323"],
    movs: ["IMG_6324.mov","IMG_6325.mov","IMG_6326.mov"],
    tags: ["tiger-claw","ivory","kundan","polki","emerald","statement","unique"],
    material: "Antique Gold Plated",
    color: "Ivory White & Emerald",
    occasion: "Festive, Statement",
  },
  {
    name: "Kundan & Pearl Round Brooch Tikka",
    description: "A resplendent circular brooch or tikka featuring a dense arrangement of vibrant pink ruby kundan stones in a radial floral pattern, centered with emerald and polki diamonds in antique gold. The bottom edge is adorned with a generous fringe of graduated freshwater pearls and jade beads. Versatile — wear as a brooch, maangtikka, or saree pin.",
    category_slug: "hair-accessories",
    heics: ["IMG_6330"],
    movs: ["IMG_6329.mov"],
    tags: ["brooch","tikka","kundan","ruby","pearl","jade","round","bridal"],
    material: "Antique Gold Plated",
    color: "Ruby Red & Pearl",
    occasion: "Bridal, Festive",
  },
  {
    name: "Grand Kundan Floral Brooch with Jade Drops",
    description: "An opulent circular brooch or maangtikka showcasing an elaborate kundan floral design with ruby-red stones, emerald accents, and polki diamonds set in antique gold. The cascading fringe of pearls, seed pearls, and mint jade beads creates a lavish waterfall effect — a showstopping piece for brides and festive occasions.",
    category_slug: "hair-accessories",
    heics: ["IMG_6331","IMG_6332"],
    movs: ["IMG_6335.mov"],
    tags: ["brooch","maangtikka","kundan","ruby","emerald","pearl","jade","bridal"],
    material: "Antique Gold Plated",
    color: "Ruby Red & Jade Green",
    occasion: "Bridal, Festive",
  },
  {
    name: "Temple Lakshmi Goddess Antique Pendant",
    description: "A sacred and artistically magnificent temple pendant featuring Goddess Lakshmi seated between two majestic elephants, rendered in exquisite antique gold detail. Flanked by ruby-red kundan stones and topped with a lotus motif, the pendant features three small hanging jhumkas with emerald bead drops — a spiritual and aesthetic treasure for cultural celebrations.",
    category_slug: "pendant-sets",
    heics: ["IMG_6338"],
    movs: ["IMG_6336.mov","IMG_6337.mov"],
    tags: ["temple","lakshmi","goddess","antique","elephant","jhumka","divine","pendant"],
    material: "Antique Gold Plated",
    color: "Antique Gold & Ruby",
    occasion: "Festive, Puja, Diwali, Gift",
  },
  {
    name: "Emerald & Diamond Tiger Claw Pendant",
    description: "A bold and mystical pendant combining the powerful tiger claw (baghnak) symbolism with an opulent emerald green center stone, surrounded by polki diamonds and white enamel accents in antique gold. The two curved ivory-like wings frame the central jewel — a truly unique collector's piece for those who appreciate the fusion of symbolism and fine craftsmanship.",
    category_slug: "pendant-sets",
    heics: ["IMG_6339"],
    movs: ["IMG_6340.mov"],
    tags: ["tiger-claw","emerald","polki","diamond","enamel","statement","unique"],
    material: "Antique Gold Plated",
    color: "Emerald Green & Ivory",
    occasion: "Festive, Statement",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uploadFile(localPath, filename) {
  const data = fs.readFileSync(localPath);
  const ext = filename.split(".").pop().toLowerCase();
  const contentTypeMap = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    mov: "video/quicktime", mp4: "video/mp4",
  };
  const contentType = contentTypeMap[ext] || "application/octet-stream";

  const { error } = await supabase.storage
    .from("product-images")
    .upload(filename, data, { contentType, cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(filename);
  return urlData.publicUrl;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔮 Krisha Sparkles — New2 Inventory Upload`);
  console.log(`📦 ${PRODUCTS.length} products to create\n`);

  // Get existing category IDs
  const { data: categories } = await supabase.from("categories").select("id,slug");
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  let created = 0, failed = 0;

  for (const [idx, product] of PRODUCTS.entries()) {
    const num = String(idx + 1).padStart(2, "0");
    console.log(`\n[${num}/${PRODUCTS.length}] ${product.name}`);

    try {
      const imageUrls = [];
      const videoUrls = [];
      const timestamp = Date.now() + idx;

      // Upload images (convert HEIC→JPG already done)
      for (const heic of product.heics) {
        const jpgPath = path.join(JPGS_DIR, `${heic}.jpg`);
        if (!fs.existsSync(jpgPath)) {
          console.log(`  ⚠ Missing JPG: ${heic}.jpg — skipping`);
          continue;
        }
        const filename = `${timestamp}-${heic}.jpg`;
        const url = await uploadFile(jpgPath, filename);
        imageUrls.push(url);
        process.stdout.write("  📸");
      }

      // Upload videos
      for (const mov of product.movs) {
        const movPath = path.join(NEW2_DIR, mov);
        if (!fs.existsSync(movPath)) {
          console.log(`  ⚠ Missing video: ${mov} — skipping`);
          continue;
        }
        const ext = mov.split(".").pop().toLowerCase();
        const filename = `${timestamp}-${mov.replace(/\s/g, "_")}`;
        const url = await uploadFile(movPath, filename);
        videoUrls.push(url);
        process.stdout.write("  🎬");
      }

      console.log(`\n  ✅ ${imageUrls.length} images, ${videoUrls.length} videos uploaded`);

      // Ensure unique slug
      const baseSlug = slugify(product.name);
      let finalSlug = baseSlug;
      const { data: existing } = await supabase.from("products").select("id").eq("slug", baseSlug).maybeSingle();
      if (existing) finalSlug = `${baseSlug}-${timestamp}`;

      const payload = {
        name: product.name,
        slug: finalSlug,
        description: product.description,
        price: 1.00,
        compare_price: null,
        category_id: catMap[product.category_slug] || null,
        images: imageUrls,
        videos: videoUrls,
        stock_quantity: 10,
        featured: false,
        active: true,
        variants: [],
        variant_stock: {},
        tags: product.tags || [],
        material: product.material || null,
        color: product.color || null,
        occasion: product.occasion || null,
        style: "Indian Traditional",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("products").insert(payload);
      if (insertError) throw new Error(insertError.message);

      console.log(`  💎 Product created: ${finalSlug}`);
      created++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`✅ Created: ${created}  ❌ Failed: ${failed}`);
  console.log(`🎉 Done! Visit admin to set prices.\n`);
}

main().catch(console.error);
