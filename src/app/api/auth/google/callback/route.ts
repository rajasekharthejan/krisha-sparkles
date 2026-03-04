import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/auth/google/callback?code=xxx&state=xxx
 * Google redirects here after user authenticates.
 * We verify CSRF state, exchange code for tokens server-side (client secret stays private),
 * then sign the user into Supabase via signInWithIdToken.
 * User never sees a supabase.co URL — they stay on shopkrisha.com the whole time.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  const next = cookieStore.get("google_oauth_next")?.value ?? "/account";

  // Derive origin from request headers — works correctly on Vercel with custom domains
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "shopkrisha.com";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  // User denied access
  if (errorParam) {
    return NextResponse.redirect(new URL("/auth/login?error=oauth_denied", origin));
  }

  // CSRF / missing code check
  if (!code || !state || state !== storedState) {
    console.error("[google/callback] State mismatch", { hasCode: !!code, hasState: !!state, hasStoredState: !!storedState, match: state === storedState });
    return NextResponse.redirect(new URL("/auth/login?error=state_mismatch", origin));
  }

  // Exchange authorization code for Google tokens (server-side — client secret never exposed)
  const redirectUri = `${origin}/api/auth/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim(),
      client_secret: (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("[google/callback] Token exchange failed:", errText);
    return NextResponse.redirect(new URL("/auth/login?error=token_exchange_failed", origin));
  }

  const { id_token, access_token } = await tokenRes.json();

  if (!id_token) {
    console.error("[google/callback] No id_token in Google response");
    return NextResponse.redirect(new URL("/auth/login?error=no_id_token", origin));
  }

  // Build the redirect response first so we can set cookies on it
  const redirectResponse = NextResponse.redirect(new URL(next, origin));

  // Sign into Supabase with the Google ID token
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: id_token,
    access_token,
  });

  if (error) {
    console.error("[google/callback] Supabase signInWithIdToken error:", error.message);
    return NextResponse.redirect(new URL(`/auth/login?error=supabase_${encodeURIComponent(error.message)}`, origin));
  }

  // Clean up state cookies
  redirectResponse.cookies.delete("google_oauth_state");
  redirectResponse.cookies.delete("google_oauth_next");

  return redirectResponse;
}
