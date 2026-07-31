import { NextResponse } from "next/server";
import { get, set, storeAvailable } from "@/lib/store";
import { allSlugs } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 2000;
const MAX_NAME = 60;

// Comments are held for review before they appear. An unmoderated box on a
// site that ranks is a spam magnet, and published spam would damage exactly
// the thing this product sells.
const AUTO_PUBLISH = process.env.COMMENTS_AUTO_PUBLISH === "true";

const SPAM = [
  /\b(viagra|casino|crypto\s*giveaway|forex\s*signal|loan\s*approval)\b/i,
  /(https?:\/\/[^\s]+){3,}/i, // three or more links
  /\b(buy|cheap)\s+(backlinks?|followers?)\b/i,
];

function looksLikeSpam(text) {
  return SPAM.some((re) => re.test(text));
}

export async function GET(req) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !allSlugs().includes(slug)) {
    return NextResponse.json({ comments: [] });
  }
  const all = (await get(`comments:${slug}`)) || [];
  // Only ever return approved comments.
  return NextResponse.json({
    comments: all
      .filter((c) => c.status === "approved")
      .map(({ name, body, at }) => ({ name, body, at })),
  });
}

export async function POST(req) {
  let payload;
  try { payload = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { slug, name, body, email, website } = payload || {};

  // Honeypot: real users never fill a hidden field.
  if (website) return NextResponse.json({ ok: true, status: "pending" });

  if (!slug || !allSlugs().includes(slug)) {
    return NextResponse.json({ error: "Unknown post." }, { status: 400 });
  }
  if (!body || body.trim().length < 3) {
    return NextResponse.json({ error: "Write a comment first." }, { status: 400 });
  }
  if (body.length > MAX_BODY) {
    return NextResponse.json({ error: `Keep it under ${MAX_BODY} characters.` }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });
  }

  const entry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: (name || "Anonymous").trim().slice(0, MAX_NAME),
    body: body.trim().slice(0, MAX_BODY),
    email: email ? email.trim().toLowerCase() : null, // never returned by GET
    at: new Date().toISOString(),
    status: looksLikeSpam(body) ? "spam" : AUTO_PUBLISH ? "approved" : "pending",
  };

  console.log(`[comment] ${slug} — ${entry.status} — ${entry.name}`);

  if (!storeAvailable) {
    return NextResponse.json({
      ok: true,
      status: "pending",
      message: "Thanks — your comment is logged for review. Add a KV store to persist comments.",
    });
  }

  try {
    const key = `comments:${slug}`;
    const all = (await get(key)) || [];
    all.push(entry);
    await set(key, all.slice(-500));
    return NextResponse.json({ ok: true, status: entry.status });
  } catch {
    return NextResponse.json({ ok: true, status: "pending", message: "Thanks — noted for review." });
  }
}
