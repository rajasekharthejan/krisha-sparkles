import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "product-images";

/**
 * Proxy product videos from Supabase storage through same-origin.
 * Supports byte-range requests for Safari/Chrome video seeking.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Only allow .mp4 files
  if (!filename.endsWith(".mp4")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;

  // Forward range header for video seeking
  const headers: Record<string, string> = {};
  const range = request.headers.get("range");
  if (range) {
    headers["Range"] = range;
  }

  const res = await fetch(storageUrl, { headers });

  if (!res.ok && res.status !== 206) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const body = res.body;
  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", "video/mp4");
  responseHeaders.set("Accept-Ranges", "bytes");
  responseHeaders.set("Cache-Control", "public, max-age=86400, immutable");

  const contentLength = res.headers.get("content-length");
  if (contentLength) responseHeaders.set("Content-Length", contentLength);

  const contentRange = res.headers.get("content-range");
  if (contentRange) responseHeaders.set("Content-Range", contentRange);

  return new Response(body, {
    status: res.status,
    headers: responseHeaders,
  });
}
