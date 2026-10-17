import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { listAlerts, ackAlerts, emailConfigured } from "@/lib/notify";
import { whatsappConfigured } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await gate();
  if (denied) return denied;
  return NextResponse.json({
    alerts: (await listAlerts()).slice(0, 30),
    channels: { email: emailConfigured(), whatsapp: whatsappConfigured() && Boolean(process.env.ALERT_WHATSAPP) },
  });
}

// POST {} -> mark all read
export async function POST() {
  const denied = await gate();
  if (denied) return denied;
  await ackAlerts();
  return NextResponse.json({ ok: true });
}
