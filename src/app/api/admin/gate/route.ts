/**
 * SECURITY: Admin gate endpoint.
 * Visit /api/admin/gate?t=YOUR_SECRET_TOKEN to receive the gate cookie
 * and be redirected to /admin/login.
 * Without this cookie, the /admin routes return 404.
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");
  const expected = process.env.ADMIN_GATE_TOKEN;

  // Invalid or missing token → generic 404, reveal nothing
  if (!token || !expected || token !== expected) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Set HttpOnly gate cookie then redirect to admin login
  const isProduction = process.env.NODE_ENV === "production";
  const redirectUrl = new URL("/admin/login", req.url);
  const res = NextResponse.redirect(redirectUrl);

  res.cookies.set("_adm_gt", expected, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return res;
}
