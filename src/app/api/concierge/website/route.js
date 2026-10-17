import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin, getClient } from "@/lib/clients";
import { listActions } from "@/lib/ledger";
import {
  testConnection, saveConnection, getConnectionInfo, disconnect, listPages, listBackups, applyChange, undoChange, WpError,
} from "@/lib/wordpress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function gate() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (!isAdmin(user)) return { error: NextResponse.json({ error: "Not authorised." }, { status: 403 }) };
  return { user };
}

// GET ?clientId -> connection (never the password), pages, backups, approved page-change actions
export async function GET(req) {
  const { error } = await gate();
  if (error) return error;
  const client = await getClient(new URL(req.url).searchParams.get("clientId"));
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  const connection = await getConnectionInfo(client.id);
  let pages = [], pagesError = null;
  if (connection) { try { pages = await listPages(client.id); } catch (e) { pagesError = e.message; } }
  const approved = (await listActions(client.id))
    .filter((a) => a.surface === "website" && a.approval?.decision === "approved" && a.status !== "done")
    .map((a) => ({ id: a.id, title: a.title, type: a.type }));
  return NextResponse.json({
    connection, pages, pagesError, approved,
    backups: (await listBackups(client.id)).map(({ before, ...b }) => b),
    autoWebsiteTech: client.onboarding?.auto?.websiteTech !== false,
  });
}

// POST { clientId, op: "connect", site, username, appPassword }
// POST { clientId, op: "disconnect" }
// POST { clientId, op: "apply", pageId, kind, html, title?, actionId? }
// POST { clientId, op: "undo", backupId }
export async function POST(req) {
  const { user, error } = await gate();
  if (error) return error;
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const client = await getClient(b?.clientId);
  if (!client) return NextResponse.json({ error: "Unknown client." }, { status: 404 });
  try {
    if (b.op === "connect") {
      const t = await testConnection(b);
      if (!t.canEdit) return NextResponse.json({ error: `Connected as ${t.user}, but that user can't edit published pages. Use an Editor or Administrator.` }, { status: 400 });
      await saveConnection(client.id, t);
      return NextResponse.json({ ok: true, user: t.user, unfilteredHtml: t.unfilteredHtml, plugins: t.plugins });
    }
    if (b.op === "disconnect") { await disconnect(client.id); return NextResponse.json({ ok: true }); }
    if (b.op === "apply") return NextResponse.json(await applyChange(client, { ...b, by: user.email }));
    if (b.op === "undo") return NextResponse.json(await undoChange(client, b.backupId, user.email));
    return NextResponse.json({ error: "Unknown operation." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e instanceof WpError ? 400 : 500 });
  }
}
