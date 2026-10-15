import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, listClients, upsertClient, removeClient, listDrafts } from "@/lib/clients";
import { hasApiToken } from "@/lib/api-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate(req) {
  if (req && hasApiToken(req)) return { user: { email: "api-token" } };
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

export async function GET(req) {
  const { error } = await gate(req);
  if (error) return error;

  const id = new URL(req.url).searchParams.get("id");
  if (id) return NextResponse.json({ drafts: await listDrafts(id) });

  return NextResponse.json({ clients: await listClients() });
}

export async function POST(req) {
  const { error } = await gate(req);
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body?.name?.trim()) return NextResponse.json({ error: "Client needs a name." }, { status: 400 });

  return NextResponse.json({ client: await upsertClient(body) });
}

export async function DELETE(req) {
  const { error } = await gate(req);
  if (error) return error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Which client?" }, { status: 400 });

  await removeClient(id);
  return NextResponse.json({ ok: true });
}
