import { NextResponse } from "next/server";
import { issueMagicLink } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(req) {
  let email;
  try { ({ email } = await req.json()); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { token, expires } = issueMagicLink(email);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const link = `${origin}/api/auth/verify?email=${encodeURIComponent(email)}&token=${token}`;

  // TODO: wire a real mail provider (Resend / SES / Gmail API) before launch.
  console.log(`[auth] magic link for ${email}: ${link}`);

  return NextResponse.json({
    ok: true,
    expiresAt: new Date(expires).toISOString(),
    ...(process.env.NODE_ENV !== "production" ? { devLink: link } : {}),
  });
}
