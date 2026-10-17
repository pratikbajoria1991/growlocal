import { NextResponse } from "next/server";
import { issueMagicLink } from "@/lib/user-store";
import { rateLimited } from "@/lib/rate-limit";
import { emailConfigured, sendEmail, alert } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(req) {
  // Tight quota — this sends email; without a limit it's an inbox-bombing vector.
  const blocked = await rateLimited(req, "auth-request", { limit: 5, windowSeconds: 600 });
  if (blocked) return blocked;

  let email;
  try { ({ email } = await req.json()); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const { token, expires } = await issueMagicLink(email);
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const link = `${origin}/api/auth/verify?email=${encodeURIComponent(email)}&token=${token}`;

  if (emailConfigured()) {
    const r = await sendEmail({
      to: email,
      subject: "Your Growlocal sign-in link",
      text: `Sign in to Growlocal:\n\n${link}\n\nThis link works once and expires in 30 minutes. If you didn't ask for it, ignore this email.`,
    });
    if (!r.sent) {
      await alert({ source: "auth", title: "Sign-in email failed to send", detail: r.reason });
      return NextResponse.json({ error: "We couldn't send the email just now. Please try again in a minute." }, { status: 502 });
    }
  } else {
    // No mail provider yet: the link only reaches the server log. Flag it so
    // it gets fixed; owners can't sign in until email is configured.
    console.log(`[auth] magic link for ${email}: ${link}`);
    if (process.env.NODE_ENV === "production") {
      await alert({ source: "auth", title: "Sign-in emails aren't being delivered", detail: "No email provider is configured (RESEND_API_KEY, MAIL_FROM). Sign-in links only appear in the server log, so owners can't sign in." });
    }
  }

  return NextResponse.json({
    ok: true,
    expiresAt: new Date(expires).toISOString(),
    ...(process.env.NODE_ENV !== "production" ? { devLink: link } : {}),
  });
}
