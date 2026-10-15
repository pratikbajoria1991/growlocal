import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { hasApiToken } from "@/lib/api-token";
import { sendMessage, recordOptIn } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate(req) {
  if (hasApiToken(req)) return null;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  return null;
}

// POST { to, text } | { to, template, lang?, params? } | { to, optIn: "source" }
// Sends are refused without consent on record — see lib/whatsapp.js.
export async function POST(req) {
  const denied = await gate(req);
  if (denied) return denied;
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!b?.to) return NextResponse.json({ error: "Missing 'to'." }, { status: 400 });

  try {
    if (b.optIn) { await recordOptIn(b.to, String(b.optIn).slice(0, 200)); return NextResponse.json({ ok: true }); }
    const data = b.template
      ? await sendMessage(b.to, "template", b)
      : await sendMessage(b.to, "text", { text: b.text || "" });
    return NextResponse.json({ ok: true, id: data.messages?.[0]?.id });
  } catch (e) {
    const status = e.code === "consent" ? 403 : e.code === "not_configured" ? 501 : 502;
    return NextResponse.json({ error: e.message, code: e.code || null }, { status });
  }
}
