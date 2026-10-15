import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient } from "@/lib/clients";
import { listActions, createAction, updateAction, decideAction, deleteAction } from "@/lib/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

async function body(req) {
  try { return await req.json(); } catch { return null; }
}

export async function GET(req) {
  const { error } = await gate();
  if (error) return error;

  const clientId = new URL(req.url).searchParams.get("clientId");
  if (!(await getClient(clientId))) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  return NextResponse.json({ actions: await listActions(clientId) });
}

export async function POST(req) {
  const { error } = await gate();
  if (error) return error;

  const b = await body(req);
  if (!b) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!(await getClient(b.clientId))) return NextResponse.json({ error: "Unknown client." }, { status: 404 });

  return NextResponse.json({ action: await createAction(b.clientId, b) });
}

export async function PATCH(req) {
  const { error, user } = await gate();
  if (error) return error;

  const b = await body(req);
  if (!b?.clientId || !b?.actionId) return NextResponse.json({ error: "Which action?" }, { status: 400 });

  try {
    // Most owners will answer "yes, go ahead" on WhatsApp rather than open a
    // dashboard. The operator can record that — but only with the evidence
    // (what they said, when), and the record shows it wasn't the owner's click.
    if (b.recordApproval) {
      const note = String(b.recordApproval.note || "").trim();
      if (!note) {
        return NextResponse.json({ error: "Paste or summarise the owner's reply so the approval has evidence." }, { status: 400 });
      }
      const action = await decideAction(b.clientId, b.actionId, {
        decision: b.recordApproval.decision,
        note,
        by: `${user.email} — recorded from owner's message`,
      });
      if (!action) return NextResponse.json({ error: "Unknown action." }, { status: 404 });
      return NextResponse.json({ action });
    }

    const action = await updateAction(b.clientId, b.actionId, b);
    if (!action) return NextResponse.json({ error: "Unknown action." }, { status: 404 });
    return NextResponse.json({ action });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 409 });
  }
}

export async function DELETE(req) {
  const { error } = await gate();
  if (error) return error;

  const sp = new URL(req.url).searchParams;
  const clientId = sp.get("clientId");
  const actionId = sp.get("actionId");
  if (!clientId || !actionId) return NextResponse.json({ error: "Which action?" }, { status: 400 });

  await deleteAction(clientId, actionId);
  return NextResponse.json({ ok: true });
}
