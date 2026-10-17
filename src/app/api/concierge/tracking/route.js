import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient } from "@/lib/clients";
import { getTrackConfig, setTrackConfig, listSnapshots, runTracking } from "@/lib/tracking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function gate() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

export async function GET(req) {
  const { error } = await gate();
  if (error) return error;
  const id = new URL(req.url).searchParams.get("clientId");
  if (!(await getClient(id))) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  return NextResponse.json({ config: await getTrackConfig(id), snapshots: (await listSnapshots(id)).slice(0, 12) });
}

// POST { clientId, keywords, grid, spacingKm } -> save settings
// POST { clientId, run: true }                 -> take a snapshot now
export async function POST(req) {
  const { error } = await gate();
  if (error) return error;
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const client = await getClient(b?.clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  try {
    if (b.run) return NextResponse.json({ snapshot: await runTracking(client) });
    return NextResponse.json({ config: await setTrackConfig(client.id, b) });
  } catch (e) {
    return NextResponse.json({ error: e.message, code: e.code || null }, { status: e.code === "no_keywords" ? 400 : 502 });
  }
}
