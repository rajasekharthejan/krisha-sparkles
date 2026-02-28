import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward pathname to layouts via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // ───────────────────────────────────────────────────────────
  // Protect account routes — redirect to login if no session
  // ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/account")) {
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ───────────────────────────────────────────────────────────
  // Admin routes — 3-layer security:
  //   1. Secret gate cookie (_adm_gt) — without it, 404
  //   2. Supabase session check
  //   3. Admin email / role check
  // ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    // LAYER 1: Gate cookie check
    // Visitors without the secret gate cookie see a plain 404.
    // This hides the existence of the admin panel entirely.
    const gateCookie = request.cookies.get("_adm_gt");
    const expectedToken = process.env.ADMIN_GATE_TOKEN;

    if (!expectedToken || !gateCookie || gateCookie.value !== expectedToken) {
      // Return bare 404 — do NOT redirect, do NOT reveal admin exists
      return new NextResponse("Not Found", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Allow the login page through (session not required yet)
    if (pathname === "/admin/login") {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // LAYER 2: Supabase session check
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // LAYER 3: Admin email check
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@krishasparkles.com").trim();
    if (adminEmail && user.email !== adminEmail) {
      // Authenticated but not the admin — sign them out and return 403
      return new NextResponse("Forbidden", {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return response;
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
