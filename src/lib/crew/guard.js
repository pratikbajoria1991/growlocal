// Guardrails — the part that keeps agents honest.
//
// Growlocal's rule is that every sentence a prospect or Google reads traces to
// a measured or owner-supplied fact. Three independent checks enforce it, and
// an item ships only if none object:
//   1. deterministic rules here (no model, can't be talked around),
//   2. a Claude reviewer agent that checks claims against the fact sheet,
//   3. a second-opinion TypeSafe/Jev check (a different model family).

import { ask, typesafeConfigured } from "../typesafe";

// Claims a health/professional business can't make on Google or its site.
const BANNED = [
  [/\b(best|no\.?\s?1|#1|number one|leading|top[- ]rated|finest|world[- ]class|premier)\b/i, "superlative claim"],
  [/\b(guarantee[d]?|100\s?%|risk[- ]free|permanent(ly)? (cure|result)|cure[sd]?)\b/i, "guarantee / cure claim"],
  [/\b(painless|no side[- ]effects?|zero risk|safe and effective)\b/i, "medical safety claim"],
  [/\b(before and after|before\/after)\b/i, "before/after claim (needs consent + proof)"],
  [/\b(award[- ]winning|awarded|certified by|accredited by|nabh|jci)\b/i, "credential/award claim"],
];

const num = (s) => String(s || "").replace(/[^\d]/g, "");

/**
 * Deterministic check of one piece of text against the fact sheet.
 * @returns {{ok: boolean, problems: string[], needsInput: string[]}}
 */
export function checkText(text, facts, ownerFacts = "") {
  const problems = [], needsInput = [];
  const t = String(text || "");
  const known = `${JSON.stringify(facts)} ${ownerFacts}`.toLowerCase();

  for (const [re, why] of BANNED) {
    const m = t.match(re);
    if (m && !known.includes(m[0].toLowerCase())) problems.push(`${why}: "${m[0]}"`);
  }
  // Placeholders are fine — they are how an agent says "I don't have this".
  for (const m of t.matchAll(/<FILL:\s*([^>]+)>/gi)) needsInput.push(m[1].trim());

  // Money, percentages, years/experience, counts of patients/clients: only if given.
  const risky = [
    /(?:₹|rs\.?|inr)\s?[\d,]+(?:\.\d+)?/gi, /\b\d+(?:\.\d+)?\s?%/g,
    /\b\d{1,3}\+?\s?(?:years?|yrs)\b/gi, /\b[\d,]{3,}\+?\s?(?:patients?|clients?|customers?|surgeries|procedures|cases|families)\b/gi,
  ];
  for (const re of risky) for (const m of t.matchAll(re)) {
    if (!known.includes(m[0].toLowerCase().replace(/\s+/g, " ").trim()) && !known.includes(num(m[0]))) problems.push(`unsupported figure: "${m[0]}"`);
  }
  // Contact details must match the verified listing exactly.
  // Only real phone shapes (10-digit mobile, or landline with STD code) that
  // aren't part of a longer number — so map coordinates (22.52575109…) and
  // IDs inside JSON-LD are not mistaken for phone numbers.
  const phones = t.match(/(?<![\d.])(?:\+?91[\s-]?)?(?:[6-9]\d{9}|[6-9]\d{4}[\s-]\d{5}|0\d{5}[\s-]\d{5}|0\d{2,4}[\s-]?\d{6,8}|\d{3,5}[\s-]\d{3,4}[\s-]\d{3,4})(?![\d.]\d)(?!\d)/g) || [];
  const factPhone = num(facts?.phone).slice(-10);
  for (const p of phones) { const d = num(p).slice(-10); if (d.length === 10 && factPhone && d !== factPhone) problems.push(`phone ${p.trim()} doesn't match the verified listing`); }
  return { ok: problems.length === 0, problems, needsInput };
}

/** Independent second opinion. Returns null when Jev isn't configured/available. */
export async function jevUnsupportedClaims(text, facts, ownerFacts = "") {
  if (!typesafeConfigured()) return null;
  try {
    const state = `FACT SHEET:\n${JSON.stringify(facts)}\n${ownerFacts ? `OWNER-SUPPLIED:\n${ownerFacts}\n` : ""}\nDRAFT TEXT:\n${text}`;
    const a = await ask(state, {
      invented: {
        type: "noul",
        instructions: "Does the DRAFT TEXT assert any specific fact (a number, price, qualification, award, named service, doctor, year, statistic or guarantee) that is NOT stated in the FACT SHEET or OWNER-SUPPLIED section? Placeholders written as <FILL: ...> do not count.",
      },
    });
    return { score: a.invented.noul, confidence: a.invented.confidence };
  } catch { return null; }
}
