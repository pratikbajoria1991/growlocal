import { NextResponse } from "next/server";
import { push, storeAvailable } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let email, site;
  try { ({ email, site } = await req.json()); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const entry = {
    email: email.toLowerCase().trim(),
    site: (site || "").trim().slice(0, 300) || null,
    at: new Date().toISOString(),
  };

  // Always log — this survives even with no store, and shows up in Vercel logs.
  console.log(`[waitlist] ${JSON.stringify(entry)}`);

  if (!storeAvailable) {
    // Degrade honestly rather than pretending we saved it.
    return NextResponse.json({
      ok: true,
      stored: false,
      message: `Thanks — we've got your interest logged. To be safe, drop us a line at ${BRAND.email} and we'll confirm your spot.`,
    });
  }

  try {
    await push("waitlist:autopilot", entry);
    return NextResponse.json({ ok: true, stored: true });
  } catch {
    return NextResponse.json({
      ok: true,
      stored: false,
      message: `Thanks — noted. Email ${BRAND.email} if you'd like a confirmation.`,
    });
  }
}
