import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient } from "@/lib/clients";
import { get, set } from "@/lib/store";
import { directoriesFor, citationProgress } from "@/lib/directories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const key = (clientId) => `concierge:citations:${clientId}`;

async function gate() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

export async function GET(req) {
  const { error } = await gate();
  if (error) return error;

  const clientId = new URL(req.url).searchParams.get("clientId");
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });

  const directories = directoriesFor(client.vertical);
  const state = (await get(key(clientId))) || {};

  return NextResponse.json({
    directories,
    state,
    progress: citationProgress(directories, state),
  });
}

export async function POST(req) {
  const { error } = await gate();
  if (error) return error;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const { clientId, directoryId, status, listingUrl } = body || {};
  const client = await getClient(clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  if (!directoryId) return NextResponse.json({ error: "Which directory?" }, { status: 400 });

  const state = (await get(key(clientId))) || {};
  state[directoryId] = {
    status: status || "todo",
    listingUrl: (listingUrl || state[directoryId]?.listingUrl || "").trim() || null,
    updatedAt: new Date().toISOString(),
  };
  await set(key(clientId), state);

  const directories = directoriesFor(client.vertical);
  return NextResponse.json({ state, progress: citationProgress(directories, state) });
}
