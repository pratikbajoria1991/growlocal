import { NextResponse } from "next/server";
import { push, storeAvailable } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Founding-client applications for Growlocal Managed. (Route name kept for
// compatibility; earlier entries live under "waitlist:autopilot".)
export async function POST(req) {
  const blocked = await rateLimited(req, "waitlist", { limit: 5, windowSeconds: 600 });
  if (blocked) return blocked;

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { email, business, phone, site, proposalId } = body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const cleanPhone = String(phone || "").replace(/[^\d+]/g, "").slice(0, 16);
  if (cleanPhone && cleanPhone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "That WhatsApp number looks too short." }, { status: 400 });
  }

  const entry = {
    email: email.toLowerCase().trim(),
    business: String(business || "").trim().slice(0, 120) || null,
    phone: cleanPhone || null,
    site: String(site || "").trim().slice(0, 300) || null,
    // Links the application to the proposal they read, so the onboarding
    // conversation starts from the same plan and price.
    proposalId: /^[A-Za-z0-9_-]{8,32}$/.test(String(proposalId || "")) ? proposalId : null,
    at: new Date().toISOString(),
  };

  // Logged without contact details — Vercel logs are not the place for
  // someone's phone number.
  console.log(`[application] business=${JSON.stringify(entry.business)} site=${JSON.stringify(entry.site)}`);

  if (!storeAvailable) {
    // Degrade honestly rather than pretending we saved it.
    return NextResponse.json({
      ok: true,
      stored: false,
      message: `We couldn't save your application automatically. Please email ${BRAND.email} with your business name so we don't miss you.`,
    });
  }

  try {
    await push("applications:managed", entry);
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({
      ok: true,
      stored: false,
      message: `Something went wrong saving that. Please email ${BRAND.email} with your business name so we don't miss you.`,
    });
  }
}
