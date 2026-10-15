import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { clientsForOwner } from "@/lib/clients";
import { decideAction } from "@/lib/ledger";
import { rateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The owner's single write into the service: approve or decline a change that
// needs their OK. Ownership is checked server-side against the client record —
// a client id in the request body is never trusted on its own.
export async function POST(req) {
  const blocked = await rateLimited(req, "owner-decide", { limit: 30, windowSeconds: 600 });
  if (blocked) return blocked;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const { clientId, actionId, decision, note } = b || {};

  const mine = await clientsForOwner(user.email);
  if (!mine.some((c) => c.id === clientId)) {
    return NextResponse.json({ error: "Not your business." }, { status: 403 });
  }

  try {
    const action = await decideAction(clientId, actionId, { decision, note, by: user.email });
    if (!action) return NextResponse.json({ error: "Unknown change." }, { status: 404 });
    return NextResponse.json({ action });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 409 });
  }
}
