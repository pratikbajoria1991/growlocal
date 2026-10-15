import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isAdmin } from "@/lib/clients";
import { BRAND } from "@/lib/brand";
import { createPreview, listPreviews, deletePreview } from "@/lib/site-preview";
import { hasApiToken } from "@/lib/api-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function gate(req) {
  if (req && hasApiToken(req)) return null;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  return null;
}

export async function GET(req) {
  const denied = await gate(req);
  if (denied) return denied;
  return NextResponse.json({ previews: await listPreviews() });
}

// POST { placeId } or { placeIds: [...] } — up to 25 per call.
export async function POST(req) {
  const denied = await gate(req);
  if (denied) return denied;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const ids = [...new Set([body?.placeId, ...(body?.placeIds || [])].filter(Boolean))].slice(0, 25);
  if (!ids.length) return NextResponse.json({ error: "Send placeId or placeIds." }, { status: 400 });

  const results = [];
  for (const id of ids) {
    try {
      const p = await createPreview(id, { force: Boolean(body?.force) });
      results.push({ placeId: id, slug: p.slug, url: `${BRAND.url}/preview/${p.slug}`, name: p.name, expiresAt: p.expiresAt });
    } catch (e) {
      results.push({ placeId: id, error: e.message, code: e.code || null });
      // A quota error will fail every remaining ID too.
      if (/quota|429/i.test(e.message)) break;
    }
  }
  return NextResponse.json({ results });
}

export async function DELETE(req) {
  const denied = await gate(req);
  if (denied) return denied;
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Which preview?" }, { status: 400 });
  await deletePreview(slug);
  return NextResponse.json({ ok: true });
}
