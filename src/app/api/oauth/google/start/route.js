import { NextResponse } from "next/server";
import { signState } from "@/lib/oauth-store";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = ["https://www.googleapis.com/auth/business.manage", "openid", "email", "profile"];

export async function GET(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/app?oauth=not_configured", req.url));
  }

  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || `${new URL(req.url).origin}/api/oauth/google/callback`;
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", signState({ uid: user.id, t: Date.now() }));

  return NextResponse.redirect(url.toString());
}
