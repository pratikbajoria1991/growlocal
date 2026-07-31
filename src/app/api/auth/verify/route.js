import { NextResponse } from "next/server";
import { consumeMagicLink } from "@/lib/user-store";
import { setSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  if (!email || !token) return NextResponse.redirect(new URL("/login?error=missing", req.url));

  const user = consumeMagicLink(email, token);
  if (!user) return NextResponse.redirect(new URL("/login?error=expired", req.url));

  await setSession(user.id);
  return NextResponse.redirect(new URL("/app", req.url));
}
