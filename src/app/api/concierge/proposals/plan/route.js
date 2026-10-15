import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient } from "@/lib/clients";
import { getProposal } from "@/lib/proposal";
import { createAction } from "@/lib/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Signed client → the proposal's four-week plan becomes their work log.
// Approval-tier items arrive already waiting for the owner.
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const proposal = await getProposal(body?.proposalId);
  if (!proposal) return NextResponse.json({ error: "Unknown proposal." }, { status: 404 });
  const client = await getClient(body?.clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });

  // Sequential on purpose: each write reads and rewrites the client's ledger.
  let created = 0;
  for (const item of proposal.plan) {
    await createAction(client.id, {
      type: item.actionType,
      title: item.title,
      detail: item.detail,
      plannedFor: item.plannedFor,
    });
    created++;
  }
  return NextResponse.json({ created });
}
