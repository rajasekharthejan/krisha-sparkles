import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/google?next=/account
 * Initiates Google OAuth authorization code flow.
 * Stores CSRF state + next destination in httpOnly cookies, then redirects to Google.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/account";

  const state = crypto.randomUUID();

  // Derive origin from request headers — works correctly on Vercel with custom domains
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "shopkrisha.com";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;
  const redirectUri = `${origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 300, // 5 minutes
    path: "/",
    sameSite: "lax" as const,
  };

  response.cookies.set("google_oauth_state", state, cookieOpts);
  response.cookies.set("google_oauth_next", next, cookieOpts);

  return response;
}
