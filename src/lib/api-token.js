// Server-to-server access for operator scripts (bulk previews, proposals).
//
// The concierge console authenticates people with a session cookie; scripts
// can't do the magic-link dance, so they send `Authorization: Bearer <token>`
// matching CONCIERGE_API_TOKEN. Fails closed: no token configured means no
// token access. Compared in constant time.

import crypto from "crypto";

export function hasApiToken(req) {
  const expected = process.env.CONCIERGE_API_TOKEN;
  if (!expected || expected.length < 32) return false;
  const header = req.headers.get("authorization") || "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
