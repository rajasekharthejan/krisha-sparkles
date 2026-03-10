/**
 * POST /api/admin/products/upload
 * Server-side image upload using service role key (bypasses RLS).
 * Accepts multipart/form-data with field "files" (one or more images).
 * Returns { urls: string[] } of public Supabase Storage URLs.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createServerSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAdminUser(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(req: NextRequest) {
  // Verify admin session
  const user = await getAdminUser(req);
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
  if (!user || user.email !== adminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("files") as File[];
  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    // Validate type
    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
      "video/quicktime", "video/mp4", "video/webm", "video/mov",
    ];
    if (!allowedTypes.includes(file.type)) {
      errors.push(`${file.name}: unsupported type (${file.type})`);
      continue;
    }
    // Validate size (100MB for videos, 10MB for images)
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`${file.name}: exceeds ${isVideo ? "100MB" : "10MB"} limit`);
      continue;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      errors.push(`${file.name}: ${uploadError.message}`);
      continue;
    }

    const { data } = supabaseAdmin.storage
      .from("product-images")
      .getPublicUrl(filename);

    urls.push(data.publicUrl);
  }

  if (urls.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }

  return NextResponse.json({ urls, errors: errors.length ? errors : undefined });
}
