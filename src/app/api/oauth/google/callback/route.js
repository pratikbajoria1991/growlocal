import { NextResponse } from "next/server";
import { verifyState, saveToken } from "@/lib/oauth-store";
import { setGbpConnected } from "@/lib/user-store";

export const runtime = "nodejs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const err = searchParams.get("error");
  const state = verifyState(searchParams.get("state"));

  if (err) return NextResponse.redirect(new URL(`/app?oauth=error&reason=${encodeURIComponent(err)}`, req.url));
  if (!state?.uid) return NextResponse.redirect(new URL("/app?oauth=error&reason=bad_state", req.url));

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/app?oauth=not_configured", req.url));

  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${new URL(req.url).origin}/api/oauth/google/callback`;

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
      }).toString(),
    });
    const tok = await res.json();
    if (!res.ok || tok.error) {
      return NextResponse.redirect(new URL(`/app?oauth=error&reason=${encodeURIComponent(tok.error || "exchange_failed")}`, req.url));
    }
    saveToken(state.uid, {
      refresh_token: tok.refresh_token || null,
      access_token: tok.access_token || null,
      scope: tok.scope || null,
      granted_at: new Date().toISOString(),
    });
    setGbpConnected(state.uid);
    return NextResponse.redirect(new URL("/app?oauth=success", req.url));
  } catch {
    return NextResponse.redirect(new URL("/app?oauth=error&reason=network", req.url));
  }
}
